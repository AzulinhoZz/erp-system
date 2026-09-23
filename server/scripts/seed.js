'use strict';

/**
 * Seed inicial: crea los roles por defecto y (opcional) un Super Admin.
 * Uso: npm run seed --workspace=server
 */
const bcrypt = require('bcryptjs');
const { env, validateEnv } = require('../src/config/env');
const { connectDb, disconnectDb } = require('../src/config/db');
const Role = require('../src/modules/core/roles/model');
const Company = require('../src/modules/core/companies/model');
const User = require('../src/modules/core/users/model');
const Account = require('../src/modules/finanzas/accounts/model');
const { DEFAULT_ROLES } = require('@erp/shared');

/** Chart of accounts created per company (Mexican-style numeric codes). */
const BASE_ACCOUNTS = [
  { code: '1000', name: 'Activo', type: 'activo' },
  { code: '1010', name: 'Bancos', type: 'activo' },
  { code: '1050', name: 'Inventarios', type: 'activo' },
  { code: '1100', name: 'Cuentas por cobrar', type: 'activo' },
  { code: '2000', name: 'Pasivo', type: 'pasivo' },
  { code: '2100', name: 'Cuentas por pagar', type: 'pasivo' },
  { code: '3000', name: 'Capital', type: 'capital' },
  { code: '4000', name: 'Ingresos por ventas', type: 'ingreso' },
  { code: '5000', name: 'Costo de ventas', type: 'gasto' },
  { code: '6000', name: 'Gastos generales', type: 'gasto' },
];

/** Wiring used by postAutomaticEntry (company.settings.defaultAccounts). */
const DEFAULT_ACCOUNT_SETTINGS = {
  inventory: '1050',
  accountsReceivable: '1100',
  accountsPayable: '2100',
  salesRevenue: '4000',
};

async function seedChartOfAccounts(company) {
  const existing = await Account.countDocuments({ companyId: company._id });
  if (existing === 0) {
    await Account.create(
      BASE_ACCOUNTS.map((a) => ({ ...a, companyId: company._id }))
    );
    console.log(`[seed] ${BASE_ACCOUNTS.length} accounts for company: ${company.name}`);
  }
  if (!company.settings?.defaultAccounts) {
    company.settings = {
      ...company.settings,
      defaultAccounts: DEFAULT_ACCOUNT_SETTINGS,
    };
    await company.save();
    console.log('[seed] settings.defaultAccounts configured');
  }
}

async function seed() {
  validateEnv();
  await connectDb();

  for (const { name, permissions } of DEFAULT_ROLES) {
    await Role.findOneAndUpdate({ name }, { name, permissions }, { upsert: true, new: true });
    console.log(`[seed] role: ${name}`);
  }

  // Bootstrap company + super admin only if no users exist yet
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    const company = await Company.create({
      name: 'Empresa Demo',
      taxId: 'DEMO0000000',
      settings: { currency: 'MXN' },
    });
    const superRole = await Role.findOne({ name: 'Super Admin' });
    await User.create({
      name: 'Super Admin',
      email: 'admin@demo.local',
      passwordHash: await bcrypt.hash('ChangeMe123!', 10),
      roleId: superRole._id,
      companyId: company._id,
      isActive: true,
    });
    await seedChartOfAccounts(company);
    console.log('[seed] company + super admin created (admin@demo.local / ChangeMe123!)');
  } else {
    // Ensure every existing company has its chart of accounts
    const companies = await Company.find();
    for (const company of companies) {
      await seedChartOfAccounts(company);
    }
  }

  await disconnectDb();
  console.log('[seed] done');
}

seed().catch((err) => {
  console.error('[seed] error:', err);
  process.exit(1);
});
