#!/usr/bin/env bash
# ==============================================================================
# Aura Cafe Platform - Automated Database Backup Script
# Supports PostgreSQL (pg_dump) & Embedded Database with GZIP Compression
# ==============================================================================

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
TIMESTAMP="$(date +'%Y%m%d_%H%M%S')"
DATABASE_URL="${DATABASE_URL:-}"
SQLITE_DB_PATH="${SQLITE_DB_PATH:-./data/cafe.db}"

mkdir -p "${BACKUP_DIR}"

echo "=========================================================="
echo " Starting Aura Cafe Database Backup: ${TIMESTAMP}"
echo " Backup Destination: ${BACKUP_DIR}"
echo "=========================================================="

# 1. PostgreSQL Backup (if DATABASE_URL is set and points to Postgres)
if [[ -n "${DATABASE_URL}" && "${DATABASE_URL}" == postgres* ]]; then
  echo "📦 Performing PostgreSQL pg_dump..."
  PG_BACKUP_FILE="${BACKUP_DIR}/postgres_backup_${TIMESTAMP}.sql.gz"
  
  if command -v pg_dump >/dev/null 2>&1; then
    pg_dump "${DATABASE_URL}" | gzip -9 > "${PG_BACKUP_FILE}"
    chmod 600 "${PG_BACKUP_FILE}"
    echo "✅ PostgreSQL backup completed: ${PG_BACKUP_FILE} ($(du -h "${PG_BACKUP_FILE}" | cut -f1))"
  else
    echo "⚠️ pg_dump binary not found in PATH. Skipping direct pg_dump."
  fi
fi

# 2. SQLite / Local Data Backup (if SQLite file exists)
if [[ -f "${SQLITE_DB_PATH}" ]]; then
  echo "📦 Performing local database backup from: ${SQLITE_DB_PATH}..."
  SQLITE_BACKUP_FILE="${BACKUP_DIR}/sqlite_cafe_backup_${TIMESTAMP}.db.gz"

  if command -v sqlite3 >/dev/null 2>&1; then
    # Atomic sqlite backup
    TEMP_SNAPSHOT="${BACKUP_DIR}/temp_snapshot_${TIMESTAMP}.db"
    sqlite3 "${SQLITE_DB_PATH}" ".backup '${TEMP_SNAPSHOT}'"
    gzip -9 -c "${TEMP_SNAPSHOT}" > "${SQLITE_BACKUP_FILE}"
    rm -f "${TEMP_SNAPSHOT}"
  else
    # Gzip copy
    gzip -9 -c "${SQLITE_DB_PATH}" > "${SQLITE_BACKUP_FILE}"
  fi

  chmod 600 "${SQLITE_BACKUP_FILE}"
  echo "✅ Local DB backup completed: ${SQLITE_BACKUP_FILE} ($(du -h "${SQLITE_BACKUP_FILE}" | cut -f1))"
fi

# 3. Clean up old backups based on retention policy
echo "🧹 Pruning backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -type f -name "*_backup_*.gz" -mtime +"${RETENTION_DAYS}" -exec rm -f {} +

echo "✨ Database backup process completed successfully!"
