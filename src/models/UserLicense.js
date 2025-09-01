const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserLicense = sequelize.define('UserLicense', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Tenants',
        key: 'id'
      }
    },
    role: {
      type: DataTypes.ENUM('owner', 'admin', 'doctor', 'assistant', 'receptionist'),
      allowNull: false,
      defaultValue: 'assistant'
    },
    permissions: {
      type: DataTypes.JSON,
      defaultValue: {
        dashboard: true,
        pacientes: true,
        agendamentos: true,
        financeiro: false,
        relatorios: false,
        configuracoes: false,
        whatsapp: false,
        telemedicina: false,
        api: false
      }
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'invited', 'suspended'),
      defaultValue: 'invited',
      allowNull: false
    },
    invitedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    acceptedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lastAccessAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    inviteToken: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    inviteExpireAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'user_licenses',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'tenantId']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['tenantId']
      },
      {
        fields: ['inviteToken']
      }
    ]
  });

  // Métodos de instância
  UserLicense.prototype.hasPermission = function(permission) {
    return this.permissions[permission] === true;
  };

  UserLicense.prototype.canAccessTenant = function() {
    return this.status === 'active';
  };

  UserLicense.prototype.isOwner = function() {
    return this.role === 'owner';
  };

  UserLicense.prototype.isAdmin = function() {
    return ['owner', 'admin'].includes(this.role);
  };

  // Métodos estáticos
  UserLicense.findUserLicenses = async function(userId) {
    return await this.findAll({
      where: { 
        userId: userId,
        status: 'active'
      },
      include: [
        {
          model: sequelize.models.Tenant,
          as: 'tenant',
          attributes: ['id', 'slug', 'nome', 'plano', 'status']
        }
      ],
      order: [['lastAccessAt', 'DESC'], ['createdAt', 'DESC']]
    });
  };

  UserLicense.findByInviteToken = async function(token) {
    return await this.findOne({
      where: {
        inviteToken: token,
        status: 'invited',
        inviteExpireAt: {
          [sequelize.Sequelize.Op.gt]: new Date()
        }
      },
      include: [
        {
          model: sequelize.models.Tenant,
          as: 'tenant'
        }
      ]
    });
  };

  return UserLicense;
};
