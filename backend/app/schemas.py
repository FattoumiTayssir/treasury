from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal

# Enums as literals
CategoryType = str  # 'RH', 'Achat', 'Vente', 'Compta', 'Autre'
SignType = str  # 'Entrée', 'Sortie'
SourceType = str  # 'Odoo', 'Entrée manuelle'
StatusType = str  # 'Actif', 'Désactivé'
FrequencyType = str  # 'Une fois', 'Mensuel', 'Annuel'
ReferenceTypeEnum = str
ExceptionTypeEnum = str
CriticalityType = str

# Permission schemas
class TabPermissionResponse(BaseModel):
    id: int
    name: str
    label: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

class UserTabPermissionResponse(BaseModel):
    tabId: int
    tabName: str
    tabLabel: str
    canView: bool
    canModify: bool
    ownDataOnly: bool = False

    class Config:
        from_attributes = True

class UserTabPermissionUpdate(BaseModel):
    tabName: str
    canView: bool
    canModify: bool
    ownDataOnly: bool = False

# User schemas
class UserBase(BaseModel):
    display_name: str
    email: EmailStr
    role: str

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    password: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    name: str
    email: str  # Changed from EmailStr to allow .local domains
    role: str
    companies: List[str] = []
    permissions: List[UserTabPermissionResponse] = []

    class Config:
        from_attributes = True

class UserWithPermissionsUpdate(BaseModel):
    display_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    password: Optional[str] = None
    companies: Optional[List[int]] = None
    permissions: Optional[List[UserTabPermissionUpdate]] = None

class PasswordChangeRequest(BaseModel):
    currentPassword: str
    newPassword: str

# Company schemas
class CompanyBase(BaseModel):
    name: str

class CompanyResponse(CompanyBase):
    id: str

    class Config:
        from_attributes = True

# Movement schemas
class MovementBase(BaseModel):
    category: CategoryType
    type: str
    amount: Decimal
    sign: SignType
    date: date
    reference_type: Optional[ReferenceTypeEnum] = None
    reference: Optional[str] = None
    reference_status: Optional[str] = None
    source: SourceType
    note: Optional[str] = None
    status: StatusType

class MovementCreate(MovementBase):
    company_id: int

class MovementResponse(BaseModel):
    id: str
    companyId: str
    category: CategoryType
    type: str
    amount: float
    sign: SignType
    date: str
    referenceType: Optional[ReferenceTypeEnum] = None
    reference: Optional[str] = None
    referenceState: Optional[str] = None
    odooLink: Optional[str] = None
    source: SourceType
    note: Optional[str] = None
    status: StatusType
    createdBy: Optional[str] = None
    createdAt: Optional[str] = None
    updatedBy: Optional[str] = None
    updatedAt: Optional[str] = None
    deactivatedBy: Optional[str] = None
    deactivatedAt: Optional[str] = None
    deactivationReason: Optional[str] = None
    excludeFromAnalytics: bool = False

    class Config:
        from_attributes = True

class MovementDeactivate(BaseModel):
    ids: List[str]
    reason: str

class MovementActivate(BaseModel):
    ids: List[str]

class MovementExcludeFromAnalytics(BaseModel):
    ids: List[str]
    exclude: bool  # True to exclude, False to include

# Manual Entry schemas
class ManualEntryBase(BaseModel):
    category: CategoryType
    type: str
    reference: Optional[str] = None
    reference_type: Optional[ReferenceTypeEnum] = None
    amount: Decimal
    sign: SignType
    frequency: FrequencyType
    start_date: str
    end_date: Optional[str] = None
    note: Optional[str] = None
    status: StatusType = "Actif"

class ManualEntryCreate(ManualEntryBase):
    company_id: int
    custom_dates: Optional[List[str]] = None

class ManualEntryUpdate(BaseModel):
    category: Optional[CategoryType] = None
    type: Optional[str] = None
    reference: Optional[str] = None
    reference_type: Optional[ReferenceTypeEnum] = None
    amount: Optional[Decimal] = None
    sign: Optional[SignType] = None
    frequency: Optional[FrequencyType] = None
    dates: Optional[List[str]] = None
    note: Optional[str] = None
    status: Optional[StatusType] = None

class ManualEntryResponse(BaseModel):
    id: str
    companyId: str
    category: CategoryType
    type: str
    reference: Optional[str] = None
    referenceType: Optional[ReferenceTypeEnum] = None
    amount: float
    sign: SignType
    frequency: FrequencyType
    start_date: str
    end_date: Optional[str] = None
    custom_dates: Optional[List[str]] = None
    note: Optional[str] = None
    status: StatusType
    createdBy: str
    createdAt: str
    updatedBy: Optional[str] = None
    updatedAt: Optional[str] = None
    referenceState: Optional[str] = None

    class Config:
        from_attributes = True

class ManualEntryDelete(BaseModel):
    ids: List[str]

# Exception schemas
class ExceptionBase(BaseModel):
    category: Optional[CategoryType] = None
    type: str
    exception_type: ExceptionTypeEnum
    criticity: CriticalityType
    description: Optional[str] = None
    amount: Decimal
    sign: Optional[SignType] = None
    reference_type: Optional[ReferenceTypeEnum] = None
    reference: Optional[str] = None
    reference_status: Optional[str] = None
    odoo_link: Optional[str] = None
    status: str

class ExceptionResponse(BaseModel):
    id: str
    companyId: str
    category: Optional[CategoryType] = None
    type: str
    exceptionType: ExceptionTypeEnum
    criticality: CriticalityType
    description: str
    amount: float
    sign: SignType
    referenceType: Optional[ReferenceTypeEnum] = None
    reference: Optional[str] = None
    referenceState: Optional[str] = None
    odooLink: Optional[str] = None
    state: str
    excludeFromAnalytics: bool = False

    class Config:
        from_attributes = True

class ExceptionUpdateState(BaseModel):
    ids: List[str]
    state: str

class ExceptionExcludeFromAnalytics(BaseModel):
    ids: List[str]
    exclude: bool  # True to exclude, False to include

# Treasury Balance Source schemas
class TreasuryBalanceSourceCreate(BaseModel):
    sourceName: str
    amount: float
    sourceDate: str
    notes: Optional[str] = None

class TreasuryBalanceSourceResponse(BaseModel):
    sourceId: int
    sourceName: str
    amount: float
    sourceDate: str
    notes: Optional[str] = None
    createdAt: str

    class Config:
        from_attributes = True

# Treasury Balance schemas
class TreasuryBalanceUpdate(BaseModel):
    companyId: str
    amount: float
    referenceDate: str
    notes: Optional[str] = None
    sources: Optional[List[TreasuryBalanceSourceCreate]] = []

class TreasuryBalanceResponse(BaseModel):
    companyId: str
    amount: float
    referenceDate: str
    updatedBy: str
    updatedAt: str
    notes: Optional[str] = None
    sources: List[TreasuryBalanceSourceResponse] = []

    class Config:
        from_attributes = True

# Auth schemas
class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    token: str
    user: UserResponse

class RefreshTokenResponse(BaseModel):
    token: str

# Last refresh schemas
class LastRefreshResponse(BaseModel):
    lastRefresh: str

# Odoo reference schemas
class ReferenceStateResponse(BaseModel):
    state: str

class CheckReferenceResponse(BaseModel):
    exists: bool
    type: Optional[str] = None
    state: Optional[str] = None

# Data Refresh schemas
class DataRefreshExecutionResponse(BaseModel):
    executionId: int
    status: str
    startedBy: str  # User display name
    startedByEmail: str
    startedAt: str
    completedAt: Optional[str] = None
    durationSeconds: Optional[int] = None
    totalRecordsProcessed: int = 0
    errorMessage: Optional[str] = None
    progressPercentage: int = 0
    currentStep: Optional[str] = None
    details: Optional[dict] = None

    class Config:
        from_attributes = True

class DataRefreshStartResponse(BaseModel):
    message: str
    executionId: int
    status: str

class DataRefreshStatusResponse(BaseModel):
    isRunning: bool
    currentExecution: Optional[DataRefreshExecutionResponse] = None

class DataRefreshProgressUpdate(BaseModel):
    executionId: int
    progressPercentage: int
    currentStep: str
    status: str
    details: Optional[dict] = None
