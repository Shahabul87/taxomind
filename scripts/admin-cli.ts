#!/usr/bin/env tsx

/**
 * CLI Script for Admin Management
 * 
 * Usage:
 *   npm run admin:create -- --email admin@example.com --name "Admin Name" --password "password"
 *   npm run admin:promote -- --email user@example.com --reason "Trusted user"
 *   npm run admin:demote -- --email admin@example.com --reason "No longer needed"
 *   npm run admin:list
 *   npm run admin:init
 */

import { PrismaClient, UserRole } from "@prisma/client";
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
  const spinner = ora("Checking for existing admins...").start();
  
  try {
    const adminCount = await prisma.user.count({
      where: { role: UserRole.ADMIN },
    });

    if (adminCount > 0) {
      spinner.stop();
      logInfo(`Found ${adminCount} existing admin(s)`);
      return;
    }

    spinner.text = "No admins found. Creating first admin...";

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
    ]);

    if (!response.email || !response.password) {
      spinner.stop();
      logError("Admin creation cancelled");
      return;
    }

    spinner.text = "Creating admin account...";

    const hashedPassword = await hash(response.password, 12);
    
    const admin = await prisma.user.create({
      data: {
        email: response.email,
        name: response.name,
        password: hashedPassword,
        role: UserRole.ADMIN,
        emailVerified: new Date(),
        isTeacher: true,
        teacherActivatedAt: new Date(),
      },
    });

    spinner.succeed("First admin created successfully!");
    
    console.log("\n" + chalk.bgGreen.black(" Admin Details "));
    console.log(`Email: ${chalk.cyan(admin.email)}`);
    console.log(`Name: ${chalk.cyan(admin.name)}`);
    console.log(`Role: ${chalk.cyan(admin.role)}`);
    console.log(`ID: ${chalk.gray(admin.id)}`);
    
  } catch (error: any) {
    spinner.fail("Failed to create admin");
    logError(error.message);
    process.exit(1);
  }
}

/**
 * Create a new admin account
 */
async function createAdmin(email: string, name: string, password: string) {
  const spinner = ora("Creating admin account...").start();
  
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      spinner.stop();
      
      if (existingUser.role === UserRole.ADMIN) {
        logWarning("User is already an admin");
        return;
      }

      // Promote existing user
      const confirmed = await prompts({
        type: "confirm",
        name: "value",
        message: `User ${email} exists. Promote to admin?`,
        initial: true,
      });

      if (confirmed.value) {
        await promoteUser(email, "CLI promotion");
      }
      return;
    }

    // Create new admin
    const hashedPassword = await hash(password, 12);
    
    const admin = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: UserRole.ADMIN,
        emailVerified: new Date(),
        isTeacher: true,
        teacherActivatedAt: new Date(),
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: "CREATE",
        userId: admin.id,
        entityId: admin.id,
        entityType: "USER",
        context: {
          method: "CLI",
          createdAt: new Date().toISOString(),
        },
      },
    });

    spinner.succeed("Admin created successfully!");
    logInfo(`Admin account created for ${chalk.cyan(email)}`);
    
  } catch (error: any) {
    spinner.fail("Failed to create admin");
    logError(error.message);
    process.exit(1);
  }
}

/**
 * Promote a user to admin
 */
async function promoteUser(email: string, reason: string) {
  const spinner = ora("Promoting user to admin...").start();
  
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      spinner.fail("User not found");
      return;
    }

    if (user.role === UserRole.ADMIN) {
      spinner.stop();
      logWarning("User is already an admin");
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        role: UserRole.ADMIN,
        isTeacher: true,
        teacherActivatedAt: new Date(),
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: "UPDATE",
        userId: "CLI",
        entityId: user.id,
        entityType: "USER",
        context: {
          previousRole: user.role,
          newRole: UserRole.ADMIN,
          reason,
          promotedAt: new Date().toISOString(),
        },
      },
    });

    spinner.succeed("User promoted to admin!");
    logInfo(`${chalk.cyan(email)} is now an admin`);
    
  } catch (error: any) {
    spinner.fail("Failed to promote user");
    logError(error.message);
    process.exit(1);
  }
}

/**
 * Demote an admin to regular user
 */
async function demoteAdmin(email: string, reason: string) {
  const spinner = ora("Demoting admin...").start();
  
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      spinner.fail("User not found");
      return;
    }

    if (user.role !== UserRole.ADMIN) {
      spinner.stop();
      logWarning("User is not an admin");
      return;
    }

    // Check if this is the last admin
    const adminCount = await prisma.user.count({
      where: { role: UserRole.ADMIN },
    });

    if (adminCount <= 1) {
      spinner.fail("Cannot demote the last admin");
      logError("At least one admin must exist in the system");
      return;
    }

    // Confirm demotion
    const confirmed = await prompts({
      type: "confirm",
      name: "value",
      message: `Are you sure you want to demote ${email} from admin?`,
      initial: false,
    });

    if (!confirmed.value) {
      spinner.stop();
      logInfo("Demotion cancelled");
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { role: UserRole.USER },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: "UPDATE",
        userId: "CLI",
        entityId: user.id,
        entityType: "USER",
        context: {
          previousRole: UserRole.ADMIN,
          newRole: UserRole.USER,
          reason,
          demotedAt: new Date().toISOString(),
        },
      },
    });

    spinner.succeed("Admin demoted successfully!");
    logInfo(`${chalk.cyan(email)} is now a regular user`);
    
  } catch (error: any) {
    spinner.fail("Failed to demote admin");
    logError(error.message);
    process.exit(1);
  }
}

/**
 * List all admins
 */
async function listAdmins() {
  const spinner = ora("Fetching admins...").start();
  
  try {
    const admins = await prisma.user.findMany({
      where: { role: UserRole.ADMIN },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        lastLoginAt: true,
        totpEnabled: true,
      },
      orderBy: { createdAt: "asc" },
    });

    spinner.stop();

    if (admins.length === 0) {
      logWarning("No admins found");
      return;
    }

    console.log("\n" + chalk.bgBlue.white(` Found ${admins.length} admin(s) `));

    const table = new Table({
      head: ["Email", "Name", "Created", "Last Login", "MFA"],
      style: {
        head: ["cyan"],
      },
    });

    admins.forEach((admin) => {
      table.push([
        admin.email || "N/A",
        admin.name || "N/A",
        admin.createdAt.toLocaleDateString(),
        admin.lastLoginAt?.toLocaleDateString() || "Never",
        admin.totpEnabled ? chalk.green("✓") : chalk.red("✗"),
      ]);
    });

    console.log(table.toString());
    
  } catch (error: any) {
    spinner.fail("Failed to fetch admins");
    logError(error.message);
    process.exit(1);
  }
}

// CLI Program Definition
program
  .name("admin-cli")
  .description("CLI tool for managing Taxomind administrators")
  .version("1.0.0");

program
  .command("init")
  .description("Initialize the first admin if none exists")
  .action(initializeAdmin);

program
  .command("create")
  .description("Create a new admin account")
  .requiredOption("-e, --email <email>", "Admin email")
  .requiredOption("-n, --name <name>", "Admin name")
  .requiredOption("-p, --password <password>", "Admin password")
  .action((options) => {
    createAdmin(options.email, options.name, options.password);
  });

program
  .command("promote")
  .description("Promote a user to admin")
  .requiredOption("-e, --email <email>", "User email")
  .option("-r, --reason <reason>", "Reason for promotion", "CLI promotion")
  .action((options) => {
    promoteUser(options.email, options.reason);
  });

program
  .command("demote")
  .description("Demote an admin to regular user")
  .requiredOption("-e, --email <email>", "Admin email")
  .option("-r, --reason <reason>", "Reason for demotion", "CLI demotion")
  .action((options) => {
    demoteAdmin(options.email, options.reason);
  });

program
  .command("list")
  .description("List all admins")
  .action(listAdmins);

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

// Cleanup on exit
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("exit", async () => {
  await prisma.$disconnect();
});