-- Schema derived from erd.mmd
-- Requires sqlcmd variable: $(DB_NAME)

USE [$(DB_NAME)];
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
BEGIN TRAN;

-- USER table (quoted as [User] because USER is a keyword)
IF OBJECT_ID(N'dbo.[User]', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.[User]
    (
        user_id       INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_User PRIMARY KEY,
        display_name  NVARCHAR(120)     NOT NULL,
        email         NVARCHAR(254)     NOT NULL,
        role          NVARCHAR(20)      NOT NULL,
        created_at    DATETIME2(3)      NOT NULL CONSTRAINT DF_User_created_at DEFAULT (SYSUTCDATETIME()),
        updated_at    DATETIME2(3)      NOT NULL CONSTRAINT DF_User_updated_at DEFAULT (SYSUTCDATETIME())
    );

    -- Unique email
    CREATE UNIQUE INDEX UX_User_email ON dbo.[User](email);

    -- Role enum constraint
    ALTER TABLE dbo.[User]
      ADD CONSTRAINT CK_User_role CHECK (role IN (N'Admin', N'Manager'));
END

-- COMPANY
IF OBJECT_ID(N'dbo.Company', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Company
    (
        company_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Company PRIMARY KEY,
        name       NVARCHAR(200)     NOT NULL
    );
END

-- USER_COMPANY
IF OBJECT_ID(N'dbo.User_Company', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.User_Company
    (
        user_company_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_User_Company PRIMARY KEY,
        user_id         INT               NOT NULL,
        company_id      INT               NOT NULL
    );

    ALTER TABLE dbo.User_Company
      ADD CONSTRAINT FK_User_Company_User FOREIGN KEY (user_id)
          REFERENCES dbo.[User](user_id);

    ALTER TABLE dbo.User_Company
      ADD CONSTRAINT FK_User_Company_Company FOREIGN KEY (company_id)
          REFERENCES dbo.Company(company_id);

    -- Prevent duplicate pairs
    CREATE UNIQUE INDEX UX_User_Company_user_company ON dbo.User_Company(user_id, company_id);
END

-- MOVEMENT
IF OBJECT_ID(N'dbo.Movement', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Movement
    (
        movement_id      INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Movement PRIMARY KEY,
        company_id       INT               NOT NULL,
        category         NVARCHAR(20)      NOT NULL,
        type             NVARCHAR(100)     NOT NULL,
        amount           DECIMAL(18,2)     NOT NULL,
        sign             NVARCHAR(10)      NOT NULL,
        movement_date    DATE              NOT NULL,
        reference_type   NVARCHAR(50)      NOT NULL,
        reference        NVARCHAR(100)     NOT NULL,
        reference_status NVARCHAR(50)      NULL,
        source           NVARCHAR(30)      NOT NULL,
        note             NVARCHAR(MAX)     NULL,
        visibility       NVARCHAR(30)      NOT NULL,
        status           NVARCHAR(20)      NOT NULL,
        created_at       DATETIME2(3)      NOT NULL CONSTRAINT DF_Movement_created_at DEFAULT (SYSUTCDATETIME()),
        created_by       INT               NOT NULL,
        odoo_link        NVARCHAR(512)     NULL,
        updated_at       DATETIME2(3)      NOT NULL CONSTRAINT DF_Movement_updated_at DEFAULT (SYSUTCDATETIME()),
        updated_by       INT               NULL,
        disabled_at      DATETIME2(3)      NULL,
        disabled_by      INT               NULL,
        disable_reason   NVARCHAR(MAX)     NULL,
        archived_at      DATETIME2(3)      NULL,
        archived_by      INT               NULL,
        archive_reason   NVARCHAR(MAX)     NULL,
        archive_version  INT               NOT NULL CONSTRAINT DF_Movement_archive_version DEFAULT(1)
    );

    -- FKs
    ALTER TABLE dbo.Movement ADD CONSTRAINT FK_Movement_Company FOREIGN KEY (company_id)
        REFERENCES dbo.Company(company_id);
    ALTER TABLE dbo.Movement ADD CONSTRAINT FK_Movement_CreatedBy FOREIGN KEY (created_by)
        REFERENCES dbo.[User](user_id);
    ALTER TABLE dbo.Movement ADD CONSTRAINT FK_Movement_UpdatedBy FOREIGN KEY (updated_by)
        REFERENCES dbo.[User](user_id);
    ALTER TABLE dbo.Movement ADD CONSTRAINT FK_Movement_DisabledBy FOREIGN KEY (disabled_by)
        REFERENCES dbo.[User](user_id);
    ALTER TABLE dbo.Movement ADD CONSTRAINT FK_Movement_ArchivedBy FOREIGN KEY (archived_by)
        REFERENCES dbo.[User](user_id);

    -- Enum constraints
    ALTER TABLE dbo.Movement ADD CONSTRAINT CK_Movement_category CHECK (category IN (N'RH', N'Achat', N'Vente', N'Compta', N'Autre'));
    ALTER TABLE dbo.Movement ADD CONSTRAINT CK_Movement_sign CHECK (sign IN (N'Entrée', N'Sortie'));
    ALTER TABLE dbo.Movement ADD CONSTRAINT CK_Movement_reference_type CHECK (reference_type IN (N'Facture', N'Avoir', N'BL', N'Cmd CLI/Fourn.'));
    ALTER TABLE dbo.Movement ADD CONSTRAINT CK_Movement_source CHECK (source IN (N'Odoo', N'Entrée manuelle'));
    ALTER TABLE dbo.Movement ADD CONSTRAINT CK_Movement_visibility CHECK (visibility IN (N'Public', N'Hors simulation', N'Privée'));
    ALTER TABLE dbo.Movement ADD CONSTRAINT CK_Movement_status CHECK (status IN (N'Actif', N'Désactivé', N'Archivé'));
    ALTER TABLE dbo.Movement ADD CONSTRAINT CK_Movement_amount_nonnegative CHECK (amount >= 0);

    -- Useful indexes
    CREATE INDEX IX_Movement_company_date ON dbo.Movement(company_id, movement_date);
    CREATE INDEX IX_Movement_company ON dbo.Movement(company_id);
    CREATE INDEX IX_Movement_created_by ON dbo.Movement(created_by);
    CREATE INDEX IX_Movement_updated_by ON dbo.Movement(updated_by);
    CREATE INDEX IX_Movement_archived_by ON dbo.Movement(archived_by);
    CREATE INDEX IX_Movement_disabled_by ON dbo.Movement(disabled_by);

    -- Enforce reference uniqueness per company, type and version
    CREATE UNIQUE INDEX UX_Movement_reference ON dbo.Movement(company_id, reference_type, reference, archive_version);
END

-- MANUAL_ENTRY (1:1 with Movement)
IF OBJECT_ID(N'dbo.Manual_Entry', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Manual_Entry
    (
        movement_id INT            NOT NULL CONSTRAINT PK_Manual_Entry PRIMARY KEY,
        frequency   NVARCHAR(20)   NOT NULL,
        dates_list  NVARCHAR(MAX)  NOT NULL
    );

    ALTER TABLE dbo.Manual_Entry ADD CONSTRAINT FK_ManualEntry_Movement FOREIGN KEY (movement_id)
        REFERENCES dbo.Movement(movement_id) ON DELETE CASCADE;

    ALTER TABLE dbo.Manual_Entry ADD CONSTRAINT CK_ManualEntry_frequency CHECK (frequency IN (N'Une fois', N'Mensuel', N'Annuel'));
    ALTER TABLE dbo.Manual_Entry ADD CONSTRAINT CK_ManualEntry_dates_list_isjson CHECK (ISJSON(dates_list) = 1);
END

-- EXCEPTION
IF OBJECT_ID(N'dbo.[Exception]', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.[Exception]
    (
        exception_id     INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Exception PRIMARY KEY,
        company_id       INT               NOT NULL,
        category         NVARCHAR(50)      NULL,
        type             NVARCHAR(100)     NOT NULL,
        exception_type   NVARCHAR(20)      NOT NULL,
        criticity        NVARCHAR(20)      NOT NULL,
        description      NVARCHAR(MAX)     NULL,
        amount           DECIMAL(18,2)     NOT NULL,
        sign             NVARCHAR(10)      NULL,
        reference_type   NVARCHAR(50)      NULL,
        reference        NVARCHAR(100)     NULL,
        reference_status NVARCHAR(50)      NULL,
        odoo_link        NVARCHAR(512)     NULL,
        status           NVARCHAR(20)      NOT NULL,
        created_at       DATETIME2(3)      NOT NULL CONSTRAINT DF_Exception_created_at DEFAULT (SYSUTCDATETIME())
    );

    ALTER TABLE dbo.[Exception] ADD CONSTRAINT FK_Exception_Company FOREIGN KEY (company_id)
        REFERENCES dbo.Company(company_id);

    ALTER TABLE dbo.[Exception] ADD CONSTRAINT CK_Exception_exception_type CHECK (exception_type IN (N'Auto', N'À ajouter', N'Partiel'));
    ALTER TABLE dbo.[Exception] ADD CONSTRAINT CK_Exception_criticity CHECK (criticity IN (N'Critique', N'Majeure', N'Warning'));
    ALTER TABLE dbo.[Exception] ADD CONSTRAINT CK_Exception_status CHECK (status IN (N'Actif', N'Désactivé'));
END

COMMIT;
GO
