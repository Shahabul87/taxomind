/**
 * Socket.io Server Entry Point
 *
 * This file starts the Socket.io server for real-time messaging features.
 * Run with: npm run socket:dev
 */

import "./socket-server";
import { logger } from "@/lib/logger";

logger.info("Socket.io server initialized");
