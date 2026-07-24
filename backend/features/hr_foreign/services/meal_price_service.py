from __future__ import annotations
import datetime
from sqlalchemy.orm import Session

from features.hr_foreign.models import EventDay, MealPriceConfig
from features.hr_foreign.schemas import MealPriceConfigCreate, MealPriceConfigUpdate


def seed_default_meal_prices(db: Session) -> None:
    if db.query(MealPriceConfig).count() == 0:
        db.add_all([
            MealPriceConfig(
                day_type="NORMAL",
                day_type_name="Ngày bình thường",
                foreign_breakfast_price=30000.0,
                foreign_dinner_price=40000.0,
                janitor_meal_price=25000.0,
                effective_from=datetime.date(2020, 1, 1),
            ),
            MealPriceConfig(
                day_type="PRESIDENT_VISIT",
                day_type_name="Chủ tịch sang",
                foreign_breakfast_price=50000.0,
                foreign_dinner_price=70000.0,
                janitor_meal_price=40000.0,
                effective_from=datetime.date(2020, 1, 1),
            ),
        ])
        db.flush()
        db.commit()


def get_meal_price_configs(db: Session) -> list[MealPriceConfig]:
    seed_default_meal_prices(db)
    return (
        db.query(MealPriceConfig)
        .order_by(MealPriceConfig.effective_from.desc(), MealPriceConfig.id.desc())
        .all()
    )


def get_meal_price_config_by_id(db: Session, config_id: int) -> MealPriceConfig | None:
    return db.query(MealPriceConfig).filter(MealPriceConfig.id == config_id).first()


def create_meal_price_config(
    db: Session, payload: MealPriceConfigCreate
) -> MealPriceConfig:
    config = MealPriceConfig(**payload.model_dump())
    db.add(config)
    db.flush()
    db.commit()
    db.refresh(config)
    return config


def update_meal_price_config(
    db: Session, config: MealPriceConfig, payload: MealPriceConfigUpdate
) -> MealPriceConfig:
    old_day_type = config.day_type
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(config, key, value)

    if payload.day_type and payload.day_type != old_day_type:
        db.query(EventDay).filter(EventDay.event_type == old_day_type).update(
            {EventDay.event_type: payload.day_type}, synchronize_session=False
        )

    db.commit()
    db.refresh(config)
    return config


def delete_meal_price_config(db: Session, config: MealPriceConfig) -> None:
    db.delete(config)
    db.commit()
