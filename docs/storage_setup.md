# 💾 Storage Setup Guide

Quantify OS is designed for maximum flexibility. You can store your intelligence data in a variety of different storage backends, depending on your needs for performance, scalability, and privacy.

## 1. Local Disk (Default)
Local disk storage is the easiest to set up and provides the best performance for single-server deployments.
- **Setup**: No configuration needed. Workspaces are automatically created in the `workspaces/` directory.
- **Use Case**: Development, personal use, or small server deployments.

## 2. Supabase / PostgreSQL
A powerful relational database option for scaling and multi-tenant scenarios.
- **Setup**: Update your `.env` file with your `SUPABASE_URL` and `SUPABASE_KEY`.
- **Use Case**: Multi-user platforms, SaaS applications, or when structured data querying is required.

## 3. MongoDB
Great for storing large volumes of unstructured JSON data, especially useful for complex evolution logs and memory.
- **Setup**: Update your `.env` file with your `MONGODB_URI`.
- **Use Case**: High-scale evolution tracking and flexible data modeling.

## 4. Google Drive / AWS S3
Ideal for long-term storage and backups of your intelligence layers.
- **Setup**: Provide the necessary credentials (e.g., `GOOGLE_APPLICATION_CREDENTIALS` or `AWS_ACCESS_KEY_ID`) in your `.env`.
- **Use Case**: Scalable, off-site data preservation and universal access.

## 5. Persistence & Backups
Regardless of your storage type, Quantify OS includes built-in backup mechanisms.
- **Manual Backups**: Trigger a system-wide backup via the `/api/system/backup` endpoint.
- **Automatic Sync**: The system can be configured to periodically sync its intelligence data to secondary storage for disaster recovery.

---
**Next Step**: See practical examples of what you can accomplish in [Example Tasks](example_tasks.md).
