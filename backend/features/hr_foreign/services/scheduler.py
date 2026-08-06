from __future__ import annotations

import asyncio
import datetime
import logging
from core.database import SessionLocal
from features.hr_foreign.services.email_service import (
    get_email_notification_config,
    send_daily_doc_warning_digest,
)

logger = logging.getLogger("email_scheduler")


async def run_email_scheduler_loop():
    logger.info("Starting Daily Document Warning Email Scheduler background task...")
    last_processed_date: datetime.date | None = None

    while True:
        try:
            now = datetime.datetime.now()
            today = now.date()

            # Check once per minute if we should send today's digest
            if last_processed_date != today:
                db = SessionLocal()
                try:
                    cfg = get_email_notification_config(db)
                    if cfg and cfg.is_enabled and cfg.scheduled_time:
                        target_hour, target_minute = map(int, cfg.scheduled_time.split(":"))
                        if now.hour == target_hour and now.minute == target_minute:
                            logger.info(f"Triggering scheduled daily email digest for {today}...")
                            success, msg, _ = send_daily_doc_warning_digest(db, trigger_type="AUTO")
                            if success:
                                logger.info("Scheduled daily email digest sent successfully.")
                            else:
                                logger.warning(f"Scheduled email digest failed: {msg}")
                            last_processed_date = today
                except Exception as e:
                    logger.error(f"Error in email scheduler loop: {e}", exc_info=True)
                finally:
                    db.close()

            await asyncio.sleep(30)
        except asyncio.CancelledError:
            logger.info("Email scheduler background task cancelled.")
            break
        except Exception as e:
            logger.error(f"Unexpected exception in email scheduler loop: {e}", exc_info=True)
            await asyncio.sleep(60)
