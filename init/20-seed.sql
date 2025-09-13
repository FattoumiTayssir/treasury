-- Idempotent fake data seed for the derived schema
-- Requires sqlcmd variable: $(DB_NAME)

USE [$(DB_NAME)];
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;

-- Companies
IF NOT EXISTS (SELECT 1 FROM dbo.Company)
BEGIN
    INSERT INTO dbo.Company(name)
    VALUES (N'Entreprise A'), (N'Entreprise B'), (N'Entreprise C');
END

-- Users
IF NOT EXISTS (SELECT 1 FROM dbo.[User])
BEGIN
    ;WITH n AS (
        SELECT TOP (15) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS n
        FROM sys.all_objects
    )
    INSERT INTO dbo.[User](display_name, email, role)
    SELECT CONCAT(N'Utilisateur ', n), CONCAT(N'user', n, N'@example.com'), 
           CASE WHEN n % 5 = 0 THEN N'Admin' ELSE N'Manager' END
    FROM n;
END

-- User_Company mapping (at least one company per user)
IF NOT EXISTS (SELECT 1 FROM dbo.User_Company)
BEGIN
    -- Primary membership
    INSERT INTO dbo.User_Company(user_id, company_id)
    SELECT u.user_id,
           (SELECT TOP 1 c.company_id FROM dbo.Company c ORDER BY NEWID())
    FROM dbo.[User] u;

    -- Some users also get a second company
    INSERT INTO dbo.User_Company(user_id, company_id)
    SELECT u.user_id, c2.company_id
    FROM dbo.[User] u
    CROSS APPLY (
        SELECT TOP 1 c.company_id
        FROM dbo.Company c
        WHERE NOT EXISTS (
            SELECT 1 FROM dbo.User_Company uc
            WHERE uc.user_id = u.user_id AND uc.company_id = c.company_id
        )
        ORDER BY NEWID()
    ) c2
    WHERE u.user_id % 3 = 0;
END

-- Movements
IF NOT EXISTS (SELECT 1 FROM dbo.Movement)
BEGIN
    ;WITH seq AS (
        SELECT TOP (200) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS n
        FROM sys.all_objects
    )
    INSERT INTO dbo.Movement (
        company_id, category, type, amount, sign, movement_date,
        reference_type, reference, reference_status, source, note, visibility,
        status, created_at, created_by, odoo_link, updated_at, updated_by, archive_version
    )
    SELECT
        c.company_id,
        cat.category,
        ty.type,
        CAST(ROUND((ABS(CHECKSUM(NEWID())) % 900000) / 100.0 + 10.00, 2) AS DECIMAL(18,2)) AS amount,
        si.sign,
        DATEADD(DAY, - (ABS(CHECKSUM(NEWID())) % 365), CAST(SYSUTCDATETIME() AS DATE)) AS movement_date,
        rt.reference_type,
        CONCAT(rt.ref_prefix, N'-', RIGHT(CONCAT(N'00000', s.n), 5)) AS reference,
        st.reference_status,
        so.source,
        NULL AS note,
        vi.visibility,
        N'Actif' AS status,
        SYSUTCDATETIME() AS created_at,
        u.user_id AS created_by,
        NULL AS odoo_link,
        SYSUTCDATETIME() AS updated_at,
        u.user_id AS updated_by,
        1 AS archive_version
    FROM seq s
    CROSS APPLY (SELECT TOP 1 company_id FROM dbo.Company ORDER BY NEWID()) c
    CROSS APPLY (SELECT TOP 1 user_id FROM dbo.[User] ORDER BY NEWID()) u
    CROSS APPLY (SELECT TOP 1 category FROM (VALUES (N'RH'),(N'Achat'),(N'Vente'),(N'Compta'),(N'Autre')) t(category) ORDER BY NEWID()) cat
    CROSS APPLY (SELECT TOP 1 type FROM (
                    VALUES (N'Salaire'),(N'Prime'),(N'Charges sociales'),
                           (N'Achat marchandises'),(N'Fournitures'),(N'Services extérieurs'),
                           (N'Prestation'),(N'Produit'),(N'Abonnement'),
                           (N'Écriture'),(N'Ajustement'),(N'Provision'),
                           (N'Divers'),(N'Frais bancaires'),(N'Investissement')
                 ) t(type) ORDER BY NEWID()) ty
    CROSS APPLY (SELECT TOP 1 sign FROM (VALUES (N'Entrée'),(N'Sortie')) t(sign) ORDER BY NEWID()) si
    CROSS APPLY (SELECT TOP 1 reference_type, ref_prefix FROM (
                    VALUES (N'Facture', N'FAC'), (N'Avoir', N'AVO'), (N'BL', N'BL'), (N'Cmd CLI/Fourn.', N'CMD')
                 ) t(reference_type, ref_prefix) ORDER BY NEWID()) rt
    CROSS APPLY (SELECT TOP 1 reference_status FROM (
                    VALUES (N'En attente'),(N'Payée'),(N'Annulée')
                 ) t(reference_status) ORDER BY NEWID()) st
    CROSS APPLY (SELECT TOP 1 source FROM (VALUES (N'Odoo'),(N'Entrée manuelle')) t(source) ORDER BY NEWID()) so
    CROSS APPLY (SELECT TOP 1 visibility FROM (VALUES (N'Public'),(N'Hors simulation'),(N'Privée')) t(visibility) ORDER BY NEWID()) vi;
END

-- Manual_Entry for a subset of movements
IF NOT EXISTS (SELECT 1 FROM dbo.Manual_Entry)
BEGIN
    DECLARE @today date = CAST(SYSUTCDATETIME() AS date);

    ;WITH candidates AS (
        SELECT TOP (40) m.movement_id
        FROM dbo.Movement m
        ORDER BY NEWID()
    ), freqs AS (
        SELECT N'Une fois' AS f UNION ALL
        SELECT N'Mensuel' UNION ALL
        SELECT N'Annuel'
    )
    INSERT INTO dbo.Manual_Entry(movement_id, frequency, dates_list)
    SELECT c.movement_id,
           f.f,
           CASE f.f
             WHEN N'Une fois' THEN N'[' + N'"' + CONVERT(nvarchar(10), @today, 126) + N'"' + N']'
             WHEN N'Mensuel'  THEN (
                 SELECT N'[' + STRING_AGG('"' + CONVERT(nvarchar(10), DATEADD(MONTH, v, @today), 126) + '"', ',') + N']'
                 FROM (VALUES (0),(1),(2),(3),(4),(5),(6),(7),(8),(9),(10),(11)) m(v)
             )
             WHEN N'Annuel'   THEN (
                 SELECT N'[' + STRING_AGG('"' + CONVERT(nvarchar(10), DATEADD(YEAR, v, @today), 126) + '"', ',') + N']'
                 FROM (VALUES (0),(1),(2)) y(v)
             )
           END AS dates_list
    FROM candidates c
    CROSS APPLY (SELECT TOP 1 f FROM freqs ORDER BY NEWID()) f
    LEFT JOIN dbo.Manual_Entry me ON me.movement_id = c.movement_id
    WHERE me.movement_id IS NULL;
END

-- Exceptions
IF NOT EXISTS (SELECT 1 FROM dbo.[Exception])
BEGIN
    ;WITH seq AS (
        SELECT TOP (30) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS n
        FROM sys.all_objects
    )
    INSERT INTO dbo.[Exception](company_id, category, type, exception_type, criticity, description, amount, sign,
                                reference_type, reference, reference_status, odoo_link, status, created_at)
    SELECT
        c.company_id,
        cat.category,
        ty.type,
        et.exception_type,
        cr.criticity,
        CONCAT(N'Description ', s.n) AS description,
        CAST(ROUND((ABS(CHECKSUM(NEWID())) % 200000) / 100.0 + 5.00, 2) AS DECIMAL(18,2)) AS amount,
        si.sign,
        rt.reference_type,
        CONCAT(rt.ref_prefix, N'-EX-', RIGHT(CONCAT(N'00000', s.n), 5)) AS reference,
        st.reference_status,
        NULL AS odoo_link,
        N'Actif' AS status,
        SYSUTCDATETIME() AS created_at
    FROM seq s
    CROSS APPLY (SELECT TOP 1 company_id FROM dbo.Company ORDER BY NEWID()) c
    CROSS APPLY (SELECT TOP 1 category FROM (VALUES (N'RH'),(N'Achat'),(N'Vente'),(N'Compta'),(N'Autre')) t(category) ORDER BY NEWID()) cat
    CROSS APPLY (SELECT TOP 1 type FROM (
                    VALUES (N'Anomalie'),(N'Différence'),(N'Rappel'),(N'Manquant')
                 ) t(type) ORDER BY NEWID()) ty
    CROSS APPLY (SELECT TOP 1 exception_type FROM (VALUES (N'Auto'),(N'À ajouter'),(N'Partiel')) t(exception_type) ORDER BY NEWID()) et
    CROSS APPLY (SELECT TOP 1 criticity FROM (VALUES (N'Critique'),(N'Majeure'),(N'Warning')) t(criticity) ORDER BY NEWID()) cr
    CROSS APPLY (SELECT TOP 1 sign FROM (VALUES (N'Entrée'),(N'Sortie')) t(sign) ORDER BY NEWID()) si
    CROSS APPLY (SELECT TOP 1 reference_type, ref_prefix FROM (
                    VALUES (N'Facture', N'FAC'), (N'Avoir', N'AVO'), (N'BL', N'BL'), (N'Cmd CLI/Fourn.', N'CMD')
                 ) t(reference_type, ref_prefix) ORDER BY NEWID()) rt
    CROSS APPLY (SELECT TOP 1 reference_status FROM (
                    VALUES (N'En attente'),(N'Payée'),(N'Annulée')
                 ) t(reference_status) ORDER BY NEWID()) st;
END
