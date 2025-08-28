const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Tenant = sequelize.define('Tenant', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isLowercase: true,
        isAlphanumeric: true,
        len: [3, 50]
      }
    },
    nome: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [2, 100]
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    telefone: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [10, 15]
      }
    },
    plano: {
      type: DataTypes.ENUM('trial', 'starter', 'professional', 'enterprise'),
      defaultValue: 'trial',
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('active', 'suspended', 'trial', 'canceled'),
      defaultValue: 'trial',
      allowNull: false
    },
    trialExpireAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    databaseName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    config: {
      type: DataTypes.JSON,
      defaultValue: {
        maxUsuarios: 3,
        maxPacientes: 500,
        whatsappEnabled: true,
        telemedicina: false,
        customBranding: false,
        apiAccess: false
      }
    },
    billing: {
      type: DataTypes.JSON,
      defaultValue: {
        proximoVencimento: null,
        valor: 0,
        customerId: null,
        subscriptionId: null
      }
    },
    theme: {
      type: DataTypes.JSON,
      defaultValue: {
        primaryColor: '#1976d2',
        logo: null,
        favicon: null,
        customDomain: null
      }
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'tenants',
    timestamps: true,
    hooks: {
      beforeCreate: async (tenant) => {
        // Gerar nome do banco automaticamente
        if (!tenant.databaseName) {
          tenant.databaseName = `tenant_${tenant.slug}_${Date.now()}`;
        }
        
        // Configurar trial por 30 dias
        if (tenant.status === 'trial') {
          const trialDays = 30;
          tenant.trialExpireAt = new Date(Date.now() + (trialDays * 24 * 60 * 60 * 1000));
        }
      },
      afterCreate: async (tenant) => {
        // Criar banco de dados para o tenant
        await createTenantDatabase(tenant.databaseName);
      }
    }
  });

  // Métodos de instância
  Tenant.prototype.isTrialExpired = function() {
    return this.status === 'trial' && new Date() > this.trialExpireAt;
  };

  Tenant.prototype.canCreateUser = function() {
    const currentUsers = this.usuarios ? this.usuarios.length : 0;
    return currentUsers < this.config.maxUsuarios;
  };

  Tenant.prototype.canCreatePaciente = function() {
    const currentPacientes = this.pacientes ? this.pacientes.length : 0;
    return currentPacientes < this.config.maxPacientes;
  };

  Tenant.prototype.upgradeToProduction = async function(plano) {
    this.status = 'active';
    this.plano = plano;
    
    // Configurar limites baseado no plano
    const plansConfig = {
      starter: {
        maxUsuarios: 3,
        maxPacientes: 500,
        whatsappEnabled: true,
        telemedicina: false,
        customBranding: false,
        apiAccess: false
      },
      professional: {
        maxUsuarios: 10,
        maxPacientes: 2000,
        whatsappEnabled: true,
        telemedicina: true,
        customBranding: true,
        apiAccess: true
      },
      enterprise: {
        maxUsuarios: -1, // ilimitado
        maxPacientes: -1, // ilimitado
        whatsappEnabled: true,
        telemedicina: true,
        customBranding: true,
        apiAccess: true
      }
    };
    
    this.config = { ...this.config, ...plansConfig[plano] };
    await this.save();
  };

  return Tenant;
};

// Função auxiliar para criar banco do tenant
async function createTenantDatabase(databaseName) {
  const fs = require('fs');
  const path = require('path');
  const sqlite3 = require('sqlite3').verbose();
  
  try {
    const dbPath = path.join(__dirname, '../../databases/', `${databaseName}.db`);
    
    // Criar diretório se não existir
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    // Criar banco SQLite
    const db = new sqlite3.Database(dbPath);
    
    // Executar migrations básicas
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '../migrations/tenant-schema.sql'), 
      'utf8'
    );
    
    await new Promise((resolve, reject) => {
      db.exec(migrationSQL, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    db.close();
    
    console.log(`✅ Database criado para tenant: ${databaseName}`);
  } catch (error) {
    console.error('❌ Erro ao criar database do tenant:', error);
    throw error;
  }
}
