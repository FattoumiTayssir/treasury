from sqlalchemy import Column, Integer, String, Numeric, Date, Text, ForeignKey, TIMESTAMP, Index, CheckConstraint, UniqueConstraint, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "User"
    
    user_id = Column(Integer, primary_key=True, index=True)
    display_name = Column(String(120), nullable=False)
    email = Column(String(254), nullable=False, unique=True)
    role = Column(String(20), nullable=False)
    password_hash = Column(String(255), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    
    movements_created = relationship("Movement", foreign_keys="Movement.created_by", back_populates="creator")
    user_companies = relationship("UserCompany", back_populates="user")
    user_permissions = relationship("UserTabPermission", back_populates="user", cascade="all, delete-orphan")

class Company(Base):
    __tablename__ = "company"
    
    company_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    
    movements = relationship("Movement", back_populates="company")
    exceptions = relationship("Exception", back_populates="company")
    user_companies = relationship("UserCompany", back_populates="company")

class ManualEntry(Base):
    __tablename__ = "manual_entry"
    
    manual_entry_id = Column(Integer, primary_key=True, index=True)
    frequency = Column(String(20), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    timezone = Column(String(64), nullable=True)
    recurrence = Column(JSON, nullable=True)
    rrule = Column(String(512), nullable=True)
    entry_metadata = Column("metadata", JSON, nullable=True)
    created_by = Column(Integer, ForeignKey("User.user_id"), nullable=False)
    
    movements = relationship("Movement", back_populates="manual_entry")
    creator = relationship("User", foreign_keys=[created_by])

class Movement(Base):
    __tablename__ = "movement"
    
    movement_id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("company.company_id"), nullable=False)
    manual_entry_id = Column(Integer, ForeignKey("manual_entry.manual_entry_id"), nullable=True)
    category = Column(String(20), nullable=False)
    type = Column(String(100), nullable=False)
    amount = Column(Numeric(18, 2), nullable=False)
    sign = Column(String(10), nullable=False)
    movement_date = Column(Date, nullable=False)
    reference_type = Column(String(50), nullable=False)
    reference = Column(String(100), nullable=False)
    reference_status = Column(String(50), nullable=True)
    source = Column(String(30), nullable=False)
    note = Column(Text, nullable=True)
    status = Column(String(20), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    created_by = Column(Integer, ForeignKey("User.user_id"), nullable=False)
    odoo_link = Column(String(512), nullable=True)
    updated_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    updated_by = Column(Integer, ForeignKey("User.user_id"), nullable=True)
    disabled_at = Column(TIMESTAMP(timezone=True), nullable=True)
    disabled_by = Column(Integer, ForeignKey("User.user_id"), nullable=True)
    disable_reason = Column(Text, nullable=True)
    archived_at = Column(TIMESTAMP(timezone=True), nullable=True)
    archived_by = Column(Integer, ForeignKey("User.user_id"), nullable=True)
    archive_reason = Column(Text, nullable=True)
    archive_version = Column(Integer, nullable=False, server_default="1")
    exclude_from_analytics = Column(Boolean, nullable=False, server_default="false")
    
    company = relationship("Company", back_populates="movements")
    manual_entry = relationship("ManualEntry", back_populates="movements")
    creator = relationship("User", foreign_keys=[created_by], back_populates="movements_created")
    
    __table_args__ = (
        Index("IX_Movement_company_date", "company_id", "movement_date"),
        Index("IX_Movement_company", "company_id"),
        Index("IX_Movement_created_by", "created_by"),
        Index("IX_Movement_updated_by", "updated_by"),
        Index("IX_Movement_archived_by", "archived_by"),
        Index("IX_Movement_disabled_by", "disabled_by"),
        UniqueConstraint("company_id", "reference_type", "reference", "archive_version", name="UX_Movement_reference"),
    )

class UserCompany(Base):
    __tablename__ = "user_company"
    
    user_company_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("User.user_id"), nullable=False)
    company_id = Column(Integer, ForeignKey("company.company_id"), nullable=False)
    
    user = relationship("User", back_populates="user_companies")
    company = relationship("Company", back_populates="user_companies")
    
    __table_args__ = (
        UniqueConstraint("user_id", "company_id", name="UX_User_Company_user_company"),
    )

class Exception(Base):
    __tablename__ = "Exception"
    
    exception_id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("company.company_id"), nullable=False)
    category = Column(String(50), nullable=True)
    type = Column(String(100), nullable=False)
    exception_type = Column(String(20), nullable=False)
    criticity = Column(String(20), nullable=False)
    description = Column(Text, nullable=True)
    amount = Column(Numeric(18, 2), nullable=False)
    sign = Column(String(10), nullable=True)
    reference_type = Column(String(50), nullable=True)
    reference = Column(String(100), nullable=True)
    reference_status = Column(String(50), nullable=True)
    odoo_link = Column(String(512), nullable=True)
    status = Column(String(20), nullable=False)
    exclude_from_analytics = Column(Boolean, nullable=False, server_default="false")
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    
    company = relationship("Company", back_populates="exceptions")

class TreasuryBalance(Base):
    __tablename__ = "treasury_balance"
    
    treasury_balance_id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("company.company_id"), nullable=False)
    amount = Column(Numeric(18, 2), nullable=False)
    reference_date = Column(Date, nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    updated_by = Column(Integer, ForeignKey("User.user_id"), nullable=False)
    notes = Column(Text, nullable=True)
    
    company = relationship("Company")
    updater = relationship("User", foreign_keys=[updated_by])
    sources = relationship("TreasuryBalanceSource", back_populates="treasury_balance", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index("IX_TreasuryBalance_company", "company_id"),
        Index("IX_TreasuryBalance_updated_by", "updated_by"),
        UniqueConstraint("company_id", "reference_date", name="UX_TreasuryBalance_company"),
    )


class TreasuryBalanceSource(Base):
    __tablename__ = "treasury_balance_source"
    
    source_id = Column(Integer, primary_key=True, index=True)
    treasury_balance_id = Column(Integer, ForeignKey("treasury_balance.treasury_balance_id", ondelete="CASCADE"), nullable=False)
    source_name = Column(String(255), nullable=False)  # e.g., "BNP Account", "Cash", "Crédit Agricole"
    amount = Column(Numeric(18, 2), nullable=False)
    source_date = Column(Date, nullable=False)  # Date when this source was checked
    notes = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    
    treasury_balance = relationship("TreasuryBalance", back_populates="sources")
    
    __table_args__ = (
        Index("IX_TreasuryBalanceSource_treasury", "treasury_balance_id"),
    )

class TabPermission(Base):
    __tablename__ = "tab_permissions"
    
    tab_id = Column(Integer, primary_key=True, index=True)
    tab_name = Column(String(50), nullable=False, unique=True)
    tab_label = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    
    user_permissions = relationship("UserTabPermission", back_populates="tab", cascade="all, delete-orphan")

class UserTabPermission(Base):
    __tablename__ = "user_tab_permissions"
    
    user_tab_permission_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("User.user_id", ondelete="CASCADE"), nullable=False)
    tab_id = Column(Integer, ForeignKey("tab_permissions.tab_id", ondelete="CASCADE"), nullable=False)
    can_view = Column(Boolean, nullable=False, server_default="false")
    can_modify = Column(Boolean, nullable=False, server_default="false")
    own_data_only = Column(Boolean, nullable=False, server_default="false")
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    
    user = relationship("User", back_populates="user_permissions")
    tab = relationship("TabPermission", back_populates="user_permissions")
    
    __table_args__ = (
        Index("IX_user_tab_permissions_user", "user_id"),
        Index("IX_user_tab_permissions_tab", "tab_id"),
        UniqueConstraint("user_id", "tab_id", name="UX_user_tab_permissions"),
    )

class DataRefreshExecution(Base):
    __tablename__ = "data_refresh_execution"
    
    execution_id = Column(Integer, primary_key=True, index=True)
    status = Column(String(20), nullable=False)
    started_by = Column(Integer, ForeignKey("User.user_id"), nullable=False)
    started_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    completed_at = Column(TIMESTAMP(timezone=True), nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    total_records_processed = Column(Integer, nullable=False, server_default="0")
    error_message = Column(Text, nullable=True)
    progress_percentage = Column(Integer, nullable=False, server_default="0")
    current_step = Column(String(100), nullable=True)
    details = Column(JSON, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    
    starter = relationship("User", foreign_keys=[started_by])
    
    __table_args__ = (
        Index("IX_data_refresh_execution_status", "status"),
        Index("IX_data_refresh_execution_started_by", "started_by"),
        Index("IX_data_refresh_execution_started_at", "started_at"),
        CheckConstraint("status IN ('running', 'completed', 'failed', 'cancelled')", name="CK_data_refresh_status"),
        CheckConstraint("progress_percentage >= 0 AND progress_percentage <= 100", name="CK_data_refresh_progress"),
    )
