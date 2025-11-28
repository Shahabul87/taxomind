#!/usr/bin/env tsx

/**
 * CLI Script for Admin Management
 *
 * NOTE: Admin auth uses AdminAccount model (separate from User model).
 * Users don't have roles - admin auth is completely separate.
 *
 * Usage:
 *   npm run admin:create -- --email admin@example.com --name "Admin Name" --password "password"
 *   npm run admin:list
 *   npm run admin:init
 */

import { PrismaClient, AdminRole } from "@prisma/client";
import { hash } from "bcryptjs";
import { program } from "commander";
import chalk from "chalk";
import ora from "ora";
const prompts = require("prompts");
import Table from "cli-table3";

const prisma = new PrismaClient();

// Utility functions
const logSuccess = (message: string) => console.log(chalk.green("✅ " + message));
const logError = (message: string) => console.log(chalk.red("❌ " + message));
const logInfo = (message: string) => console.log(chalk.blue("ℹ️  " + message));
const logWarning = (message: string) => console.log(chalk.yellow("⚠️  " + message));

/**
 * Initialize the first admin if none exists
 */
async function initializeAdmin() {
  const spinner = ora("Checking for existing admin accounts...").start();

  try {
    // Check AdminAccount table (separate from User model)
    const adminCount = await prisma.adminAccount.count();

    if (adminCount > 0) {
      spinner.stop();
      logInfo(`Found ${adminCount} existing admin account(s)`);
      return;
    }

    spinner.text = "No admin accounts found. Creating first admin...";

    // Prompt for admin details
    const response = await prompts([
      {
        type: "text",
        name: "email",
        message: "Enter admin email:",
        validate: (email: string) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(email) || "Please enter a valid email";
        },
      },
      {
        type: "text",
        name: "name",
        message: "Enter admin name:",
        validate: (name: string) => name.length > 0 || "Name is required",
      },
      {
        type: "password",
        name: "password",
        message: "Enter admin password:",
        validate: (password: string) => password.length >= 8 || "Password must be at least 8 characters",
      },
      {
        type: "password",
        name: "confirmPassword",
        message: "Confirm password:",
        validate: (confirmPassword: string, answers: any) =>
          confirmPassword === answers?.password || "Passwords do not match",
      },
      {
        type: "select",
        name: "role",
        message: "Select admin role:",
        choices: [
          { title: "ADMIN", value: AdminRole.ADMIN },
          { title: "SUPERADMIN", value: AdminRole.SUPERADMIN },
        ],
        initial: 0,
      },
    ]);

    if (!response.email || !response.password) {
      spinner.stop();
      logError("Admin creation cancelled");
      return;
    }

    spinner.text = "Creating admin account...";

    const hashedPassword = await hash(response.password, 12);

    // Create in AdminAccount table (not User)
    const admin = await prisma.adminAccount.create({
      data: {
        email: response.email,
        name: response.name,
        password: hashedPassword,
        role: response.role || AdminRole.ADMIN,
        emailVerified: new Date(),
      },
    });

    spinner.succeed("First admin account created successfully!");

    console.log("\n" + chalk.bgGreen.black(" Admin Account Details "));
    console.log(`Email: ${chalk.cyan(admin.email)}`);
    console.log(`Name: ${chalk.cyan(admin.name)}`);
    console.log(`Role: ${chalk.cyan(admin.role)}`);
    console.log(`ID: ${chalk.gray(admin.id)}`);
    console.log("\n" + chalk.yellow("Login at: http://localhost:3000/admin/auth/login"));

  } catch (error: any) {
    spinner.fail("Failed to create admin account");
    logError(error.message);
    process.exit(1);
  }
}

/**
 * Create a new admin account
 */
async function createAdmin(email: string, name: string, password: string, role: string) {
  const spinner = ora("Creating admin account...").start();

  try {
    // Check if admin account already exists
    const existingAdmin = await prisma.adminAccount.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      spinner.stop();
      logWarning("Admin account with this email already exists");
      return;
    }

    // Create new admin account
    const hashedPassword = await hash(password, 12);

    const admin = await prisma.adminAccount.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: role === "SUPERADMIN" ? AdminRole.SUPERADMIN : AdminRole.ADMIN,
        emailVerified: new Date(),
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: "CREATE",
        userId: "CLI",
        entityId: admin.id,
        entityType: "ADMIN_ACCOUNT",
        context: {
          method: "CLI",
          createdAt: new Date().toISOString(),
          adminEmail: admin.email,
          adminRole: admin.role,
        },
      },
    });

    spinner.succeed("Admin account created successfully!");
    logInfo(`Admin account created for ${chalk.cyan(email)}`);
    console.log(`Role: ${chalk.cyan(admin.role)}`);
    console.log("\n" + chalk.yellow("Login at: http://localhost:3000/admin/auth/login"));

  } catch (error: any) {
    spinner.fail("Failed to create admin account");
    logError(error.message);
    process.exit(1);
  }
}

/**
 * Update admin role
 */
async function updateAdminRole(email: string, newRole: string, reason: string) {
  const spinner = ora("Updating admin role...").start();

  try {
    const admin = await prisma.adminAccount.findUnique({
      where: { email },
    });

    if (!admin) {
      spinner.fail("Admin account not found");
      return;
    }

    const adminRole = newRole === "SUPERADMIN" ? AdminRole.SUPERADMIN : AdminRole.ADMIN;

    if (admin.role === adminRole) {
      spinner.stop();
      logWarning(`Admin already has role: ${adminRole}`);
      return;
    }

    await prisma.adminAccount.update({
      where: { id: admin.id },
      data: { role: adminRole },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: "UPDATE",
        userId: "CLI",
        entityId: admin.id,
        entityType: "ADMIN_ACCOUNT",
        context: {
          previousRole: admin.role,
          newRole: adminRole,
          reason,
          updatedAt: new Date().toISOString(),
        },
      },
    });

    spinner.succeed("Admin role updated successfully!");
    logInfo(`${chalk.cyan(email)} role changed to ${chalk.cyan(adminRole)}`);

  } catch (error: any) {
    spinner.fail("Failed to update admin role");
    logError(error.message);
    process.exit(1);
  }
}

/**
 * Delete an admin account
 */
async function deleteAdmin(email: string, reason: string) {
  const spinner = ora("Checking admin account...").start();

  try {
    const admin = await prisma.adminAccount.findUnique({
      where: { email },
    });

    if (!admin) {
      spinner.fail("Admin account not found");
      return;
    }

    // Check if this is the last admin
    const adminCount = await prisma.adminAccount.count();

    if (adminCount <= 1) {
      spinner.fail("Cannot delete the last admin account");
      logError("At least one admin account must exist in the system");
      return;
    }

    spinner.stop();

    // Confirm deletion
    const confirmed = await prompts({
      type: "confirm",
      name: "value",
      message: `Are you sure you want to delete admin account ${email}?`,
      initial: false,
    });

    if (!confirmed.value) {
      logInfo("Deletion cancelled");
      return;
    }

    spinner.start("Deleting admin account...");

    await prisma.adminAccount.delete({
      where: { id: admin.id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: "DELETE",
        userId: "CLI",
        entityId: admin.id,
        entityType: "ADMIN_ACCOUNT",
        context: {
          deletedEmail: admin.email,
          deletedRole: admin.role,
          reason,
          deletedAt: new Date().toISOString(),
        },
      },
    });

    spinner.succeed("Admin account deleted successfully!");
    logInfo(`${chalk.cyan(email)} has been removed`);

  } catch (error: any) {
    spinner.fail("Failed to delete admin account");
    logError(error.message);
    process.exit(1);
  }
}

/**
 * List all admin accounts
 */
async function listAdmins() {
  const spinner = ora("Fetching admin accounts...").start();

  try {
    const admins = await prisma.adminAccount.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
        isTwoFactorEnabled: true,
        isAccountLocked: true,
      },
      orderBy: { createdAt: "asc" },
    });

    spinner.stop();

    if (admins.length === 0) {
      logWarning("No admin accounts found");
      logInfo("Use 'admin-cli init' to create the first admin account");
      return;
    }

    console.log("\n" + chalk.bgBlue.white(` Found ${admins.length} admin account(s) `));
    console.log(chalk.gray("(AdminAccount model - separate from User)"));

    const table = new Table({
      head: ["Email", "Name", "Role", "Created", "Last Login", "MFA", "Locked"],
      style: {
        head: ["cyan"],
      },
    });

    admins.forEach((admin) => {
      table.push([
        admin.email || "N/A",
        admin.name || "N/A",
        admin.role,
        admin.createdAt.toLocaleDateString(),
        admin.lastLoginAt?.toLocaleDateString() || "Never",
        admin.isTwoFactorEnabled ? chalk.green("✓") : chalk.red("✗"),
        admin.isAccountLocked ? chalk.red("Yes") : chalk.green("No"),
      ]);
    });

    console.log(table.toString());

  } catch (error: any) {
    spinner.fail("Failed to fetch admin accounts");
    logError(error.message);
    process.exit(1);
  }
}

// CLI Program Definition
program
  .name("admin-cli")
  .description("CLI tool for managing Taxomind admin accounts (AdminAccount model)")
  .version("2.0.0");

program
  .command("init")
  .description("Initialize the first admin account if none exists")
  .action(initializeAdmin);

program
  .command("create")
  .description("Create a new admin account")
  .requiredOption("-e, --email <email>", "Admin email")
  .requiredOption("-n, --name <name>", "Admin name")
  .requiredOption("-p, --password <password>", "Admin password")
  .option("-r, --role <role>", "Admin role (ADMIN or SUPERADMIN)", "ADMIN")
  .action((options) => {
    createAdmin(options.email, options.name, options.password, options.role);
  });

program
  .command("update-role")
  .description("Update an admin account role")
  .requiredOption("-e, --email <email>", "Admin email")
  .requiredOption("-r, --role <role>", "New role (ADMIN or SUPERADMIN)")
  .option("--reason <reason>", "Reason for role change", "CLI update")
  .action((options) => {
    updateAdminRole(options.email, options.role, options.reason);
  });

program
  .command("delete")
  .description("Delete an admin account")
  .requiredOption("-e, --email <email>", "Admin email")
  .option("--reason <reason>", "Reason for deletion", "CLI deletion")
  .action((options) => {
    deleteAdmin(options.email, options.reason);
  });

program
  .command("list")
  .description("List all admin accounts")
  .action(listAdmins);

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
  console.log("\n" + chalk.gray("Note: Admin auth uses AdminAccount model (separate from User)."));
  console.log(chalk.gray("Users don't have roles - admin auth is completely separate."));
}

// Cleanup on exit
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("exit", async () => {
  await prisma.$disconnect();
});
