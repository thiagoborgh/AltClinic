const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

// Inicializar Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// ===================== OBSERVAÇÃO IMPORTANTE =====================
// whatsapp-web.js NÃO PODE rodar em Cloud Functions devido ao Puppeteer
// 
// Opções para produção:
// 1. Cloud Run com Docker (imagem com Chrome) - RECOMENDADO
// 2. Compute Engine (VM free tier)
// 3. Servidor local com ngrok/cloudflare tunnel
//
// As functions abaixo servem para:
// - Armazenar dados no Firestore
// - Cleanup automático
// - Estatísticas
// - API auxiliar
// ==================================================================

// ===================== ESTATÍSTICAS =====================

/**
 * Cloud Function HTTP para obter estatísticas do WhatsApp
 */
exports.getWhatsAppStats = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Usuário deve estar autenticado');
    }

    const { tenantId } = data;

    if (!tenantId) {
      throw new functions.https.HttpsError('invalid-argument', 'tenantId é obrigatório');
    }

    // Buscar estatísticas
    const [messagesSnapshot, contactsSnapshot, sessionSnapshot] = await Promise.all([
      db.collection('tenants').doc(tenantId).collection('whatsapp_messages').get(),
      db.collection('tenants').doc(tenantId).collection('whatsapp_contacts').get(),
      db.collection('tenants').doc(tenantId).collection('whatsapp_sessions')
        .where('status', '==', 'connected').get()
    ]);

    // Contar mensagens por direção
    let inbound = 0;
    let outbound = 0;
    messagesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.direction === 'inbound') inbound++;
      if (data.direction === 'outbound') outbound++;
    });

    return {
      success: true,
      stats: {
        totalMessages: messagesSnapshot.size,
        inboundMessages: inbound,
        outboundMessages: outbound,
        totalContacts: contactsSnapshot.size,
        hasActiveSession: !sessionSnapshot.empty
      }
    };

  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ===================== CLEANUP AUTOMÁTICO =====================

/**
 * Cloud Function para limpar mensagens antigas (executado diariamente)
 * Remove mensagens com mais de 90 dias
 */
exports.cleanupOldMessages = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90); // 90 dias atrás

      const tenantsSnapshot = await db.collection('tenants').get();

      let totalDeleted = 0;

      for (const tenantDoc of tenantsSnapshot.docs) {
        const tenantId = tenantDoc.id;

        const oldMessagesSnapshot = await db
          .collection('tenants')
          .doc(tenantId)
          .collection('whatsapp_messages')
          .where('createdAt', '<', cutoffDate.toISOString())
          .limit(500) // Processar em lotes
          .get();

        // Deletar em batch
        const batch = db.batch();
        oldMessagesSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });

        await batch.commit();
        totalDeleted += oldMessagesSnapshot.size;

        console.log(`🧹 ${oldMessagesSnapshot.size} mensagens antigas deletadas do tenant ${tenantId}`);
      }

      console.log(`✅ Cleanup completo: ${totalDeleted} mensagens deletadas`);
      return null;

    } catch (error) {
      console.error('❌ Erro no cleanup de mensagens:', error);
      return null;
    }
  });

// ===================== STORAGE TRIGGERS =====================

/**
 * Trigger quando arquivo de mídia é enviado ao Storage
 * Atualiza documento da mensagem com URL pública
 */
exports.onMediaUploaded = functions.storage.object().onFinalize(async (object) => {
  try {
    const filePath = object.name; // Ex: whatsapp_media/tenant123/abc123.jpg
    
    if (!filePath.startsWith('whatsapp_media/')) {
      return null;
    }

    // Extrair tenant e message ID do path
    const pathParts = filePath.split('/');
    if (pathParts.length < 3) {
      return null;
    }

    const tenantId = pathParts[1];
    const fileName = pathParts[2];
    const messageId = fileName.split('.')[0];

    // Atualizar documento da mensagem com URL pública
    const messageRef = db
      .collection('tenants')
      .doc(tenantId)
      .collection('whatsapp_messages')
      .doc(messageId);

    const publicUrl = `https://storage.googleapis.com/${object.bucket}/${filePath}`;

    await messageRef.update({
      mediaUrl: publicUrl,
      mediaUploaded: true,
      mediaUploadedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ URL de mídia atualizada para mensagem ${messageId}`);
    return null;

  } catch (error) {
    console.error('❌ Erro ao processar upload de mídia:', error);
    return null;
  }
});

// ===================== API AUXILIAR =====================

/**
 * Endpoint para receber notificações/webhooks externos
 * (opcional - pode ser usado para integrar com outros serviços)
 */
exports.whatsappWebhook = functions.https.onRequest(async (req, res) => {
  try {
    res.set('Access-Control-Allow-Origin', '*');
    
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Methods', 'POST');
      res.set('Access-Control-Allow-Headers', 'Content-Type');
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const tenantId = req.query.tenantId;
    const webhookData = req.body;
    
    if (!tenantId) {
      res.status(400).send('tenantId required');
      return;
    }

    // Salvar webhook no Firestore para auditoria
    await db
      .collection('tenants')
      .doc(tenantId)
      .collection('whatsapp_webhooks')
      .add({
        data: webhookData,
        receivedAt: admin.firestore.FieldValue.serverTimestamp()
      });

    console.log(`📥 Webhook recebido para ${tenantId}`);

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    res.status(500).send('Error');
  }
});

console.log('🚀 Firebase Functions para WhatsApp carregadas (sem Twilio - opensource)');

// ===================== WEBHOOK TWILIO =====================

/**
 * Cloud Function para receber webhooks do Twilio
 * URL: https://REGION-PROJECT_ID.cloudfunctions.net/whatsappWebhook
 */
exports.whatsappWebhook = functions.https.onRequest(async (req, res) => {
  try {
    // CORS
    res.set('Access-Control-Allow-Origin', '*');
    
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Methods', 'POST');
      res.set('Access-Control-Allow-Headers', 'Content-Type');
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const { 
      From, 
      To, 
      Body, 
      MessageSid, 
      ProfileName,
      MediaUrl0,
      NumMedia 
    } = req.body;

    console.log('📥 Webhook recebido do Twilio:', {
      from: From,
      to: To,
      body: Body,
      messageSid: MessageSid
    });

    // Extrair tenant ID do query parameter
    const tenantId = req.query.tenantId;
    
    if (!tenantId) {
      console.warn('⚠️ Webhook recebido sem tenantId');
      // Responder OK mesmo assim para não causar retry do Twilio
      res.set('Content-Type', 'text/xml');
      res.send(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`);
      return;
    }

    // Processar dados
    const isWhatsApp = From.startsWith('whatsapp:');
    const phone = From.replace('whatsapp:', '').replace('+', '');
    const hasMedia = parseInt(NumMedia || 0) > 0;

    // Salvar mensagem no Firestore
    const messageData = {
      contactPhone: phone,
      contactName: ProfileName || phone,
      message: Body || '',
      direction: 'inbound',
      status: 'received',
      provider: 'twilio',
      messageSid: MessageSid,
      hasMedia,
      mediaUrl: hasMedia ? MediaUrl0 : null,
      receivedAt: admin.firestore.FieldValue.serverTimestamp(),
      tenantId
    };

    // Salvar na coleção de mensagens
    await db
      .collection('tenants')
      .doc(tenantId)
      .collection('whatsapp_messages')
      .add(messageData);

    // Atualizar/criar contato
    const contactRef = db
      .collection('tenants')
      .doc(tenantId)
      .collection('whatsapp_contacts')
      .doc(phone);

    await contactRef.set({
      phone,
      name: ProfileName || phone,
      lastMessage: Body || '(mídia)',
      lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      tenantId
    }, { merge: true });

    // Log do webhook
    await db
      .collection('tenants')
      .doc(tenantId)
      .collection('whatsapp_webhooks')
      .add({
        from: From,
        to: To,
        body: Body,
        messageSid: MessageSid,
        hasMedia,
        receivedAt: admin.firestore.FieldValue.serverTimestamp()
      });

    console.log('✅ Mensagem salva no Firestore:', phone);

    // Responder ao Twilio (opcional - pode enviar resposta automática)
    res.set('Content-Type', 'text/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Obrigado pela mensagem! Responderemos em breve.</Message>
</Response>`);

  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    
    // Responder OK mesmo com erro para evitar retry infinito do Twilio
    res.set('Content-Type', 'text/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`);
  }
});

// ===================== ENVIO DE MENSAGENS =====================

/**
 * Cloud Function para enviar mensagens via Twilio
 * Chamada pelo backend principal
 */
exports.sendWhatsAppMessage = functions.https.onCall(async (data, context) => {
  try {
    // Verificar autenticação
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Usuário deve estar autenticado'
      );
    }

    const { tenantId, phone, message, contactName } = data;

    if (!tenantId || !phone || !message) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'tenantId, phone e message são obrigatórios'
      );
    }

    // Buscar configuração do Twilio do tenant
    const configDoc = await db
      .collection('tenants')
      .doc(tenantId)
      .collection('settings')
      .doc('whatsapp')
      .get();

    if (!configDoc.exists) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Configuração do WhatsApp não encontrada'
      );
    }

    const config = configDoc.data();
    
    // Aqui você integraria com o Twilio
    // Por enquanto, apenas simulamos o envio e salvamos no Firestore

    // Salvar mensagem enviada
    const messageRef = await db
      .collection('tenants')
      .doc(tenantId)
      .collection('whatsapp_messages')
      .add({
        contactPhone: phone.replace(/\D/g, ''),
        contactName: contactName || phone,
        message,
        direction: 'outbound',
        status: 'sent',
        provider: 'twilio',
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        tenantId
      });

    // Atualizar contato
    const contactRef = db
      .collection('tenants')
      .doc(tenantId)
      .collection('whatsapp_contacts')
      .doc(phone.replace(/\D/g, ''));

    await contactRef.set({
      phone: phone.replace(/\D/g, ''),
      name: contactName || phone,
      lastMessage: message,
      lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      tenantId
    }, { merge: true });

    return {
      success: true,
      messageId: messageRef.id,
      message: 'Mensagem enviada com sucesso'
    };

  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ===================== CLEANUP AUTOMÁTICO =====================

/**
 * Cloud Function para limpar mensagens antigas (executado diariamente)
 * Remove mensagens com mais de 90 dias
 */
exports.cleanupOldMessages = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90); // 90 dias atrás

      const tenantsSnapshot = await db.collection('tenants').get();

      let totalDeleted = 0;

      for (const tenantDoc of tenantsSnapshot.docs) {
        const tenantId = tenantDoc.id;

        const oldMessagesSnapshot = await db
          .collection('tenants')
          .doc(tenantId)
          .collection('whatsapp_messages')
          .where('createdAt', '<', cutoffDate.toISOString())
          .limit(500) // Processar em lotes
          .get();

        // Deletar em batch
        const batch = db.batch();
        oldMessagesSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });

        await batch.commit();
        totalDeleted += oldMessagesSnapshot.size;

        console.log(`🧹 ${oldMessagesSnapshot.size} mensagens antigas deletadas do tenant ${tenantId}`);
      }

      console.log(`✅ Cleanup completo: ${totalDeleted} mensagens deletadas`);
      return null;

    } catch (error) {
      console.error('❌ Erro no cleanup de mensagens:', error);
      return null;
    }
  });

// ===================== ESTATÍSTICAS =====================

/**
 * Cloud Function HTTP para obter estatísticas do WhatsApp
 */
exports.getWhatsAppStats = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Usuário deve estar autenticado');
    }

    const { tenantId } = data;

    if (!tenantId) {
      throw new functions.https.HttpsError('invalid-argument', 'tenantId é obrigatório');
    }

    // Buscar estatísticas
    const [messagesSnapshot, contactsSnapshot, sessionSnapshot] = await Promise.all([
      db.collection('tenants').doc(tenantId).collection('whatsapp_messages').get(),
      db.collection('tenants').doc(tenantId).collection('whatsapp_contacts').get(),
      db.collection('tenants').doc(tenantId).collection('whatsapp_sessions')
        .where('status', '==', 'connected').get()
    ]);

    // Contar mensagens por direção
    let inbound = 0;
    let outbound = 0;
    messagesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.direction === 'inbound') inbound++;
      if (data.direction === 'outbound') outbound++;
    });

    return {
      success: true,
      stats: {
        totalMessages: messagesSnapshot.size,
        inboundMessages: inbound,
        outboundMessages: outbound,
        totalContacts: contactsSnapshot.size,
        hasActiveSession: !sessionSnapshot.empty
      }
    };

  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ===================== STORAGE TRIGGERS =====================

/**
 * Trigger quando arquivo de mídia é enviado ao Storage
 * Atualiza documento da mensagem com URL pública
 */
exports.onMediaUploaded = functions.storage.object().onFinalize(async (object) => {
  try {
    const filePath = object.name; // Ex: whatsapp_media/tenant123/abc123.jpg
    
    if (!filePath.startsWith('whatsapp_media/')) {
      return null;
    }

    // Extrair tenant e message ID do path
    const pathParts = filePath.split('/');
    if (pathParts.length < 3) {
      return null;
    }

    const tenantId = pathParts[1];
    const fileName = pathParts[2];
    const messageId = fileName.split('.')[0];

    // Atualizar documento da mensagem com URL pública
    const messageRef = db
      .collection('tenants')
      .doc(tenantId)
      .collection('whatsapp_messages')
      .doc(messageId);

    const publicUrl = `https://storage.googleapis.com/${object.bucket}/${filePath}`;

    await messageRef.update({
      mediaUrl: publicUrl,
      mediaUploaded: true,
      mediaUploadedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ URL de mídia atualizada para mensagem ${messageId}`);
    return null;

  } catch (error) {
    console.error('❌ Erro ao processar upload de mídia:', error);
    return null;
  }
});

console.log('🚀 Firebase Functions para WhatsApp carregadas');
