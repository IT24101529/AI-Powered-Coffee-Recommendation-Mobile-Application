# database.py
# Sets up the database connection and defines the CoffeeProduct table.
# Owner: Ekanayake E.M.T.D.B. | IT24100917

import os
from sqlalchemy import create_engine, Column, Integer, String, Float, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv(
    'DATABASE_URL',
    'postgresql://postgres:password@localhost:5432/coffee_db'
)

engine       = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base         = declarative_base()


class CoffeeProduct(Base):
    __tablename__ = 'products'

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String, unique=True, nullable=False)
    category    = Column(String)
    price       = Column(Float)
    description = Column(Text)
    image_url   = Column(String, nullable=True)

    # Feature vector (0.0 – 10.0)
    sweetness   = Column(Float, default=5.0)
    bitterness  = Column(Float, default=5.0)
    acidity     = Column(Float, default=5.0)
    richness    = Column(Float, default=5.0)
    caffeine    = Column(Float, default=5.0)
    warmth      = Column(Float, default=5.0)

    # Properties
    calories    = Column(Float, default=100.0)
    temperature = Column(String, default='Hot')   # Hot / Iced / Blended

    # Context suitability (comma-separated)
    best_moods   = Column(String, default='Calm,Happy')
    best_weather = Column(String, default='Warm')
    best_times   = Column(String, default='Morning,Afternoon')

    # Popularity (updated by Ishaak's trending module)
    popularity_score = Column(Float, default=5.0)


def create_tables():
    Base.metadata.create_all(bind=engine)
    print('Database tables created successfully!')


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
