-- Step 1: Insert all empresas and return their IDs
-- Step 2: Update mandatos with empresa_principal_id

-- Create empresas
INSERT INTO empresas (nombre, sector, es_target) VALUES
('PROTIDENT S.L.', 'Salud', false),
('CARGESTION S.L.', 'Logística', false),
('TUCSEGUR ALARMAS SL', 'Seguridad', false),
('COLABORA INGENERIOS', 'Ingeniería', false),
('GEINSUR SERVICIOS INTEGRALES SL', 'Servicios', false),
('FASTER WEAR SL', 'Textil', false),
('AQUORE', 'Agua/Medioambiente', false),
('ALUJAVI SL', 'Construcción', false),
('COSAMO PACKAGING SL', 'Packaging', false),
('HORMIGONES SIERRA SL', 'Construcción', false),
('ENERGYEAR', 'Energía', false),
('MQ DENT', 'Dental', false),
('VALLDURADENT', 'Dental', false),
('MENYBER GLOBAL SERVICES', 'Servicios', false),
('BACUS BIER S.L', 'Alimentación', false),
('EXARISER', 'Tecnología', false),
('FORJAS ESTILO ESPAÑOL SL', 'Industrial', false),
('HERRERA-AURIA TELECOM (ZENTRO TELECOM)', 'Telecomunicaciones', false),
('ADDINGPLUS', 'Servicios', false),
('MATORFE SL', 'Industrial', false),
('LOUIS ARMANND OPTICS SL', 'Óptica', false),
('CLÍNICA PIZARRO MONTENEGRO', 'Salud', false),
('ABACO SUYTEC SA', 'Industrial', false),
('FB INTEC', 'Tecnología', false),
('EXCAVACIONS PETIT', 'Construcción', false),
('EDIM VALLES', 'Construcción', false),
('DENTAL GONZALO Y LAGUNAS', 'Dental', false),
('LABORATORIO DENTAL OSCAR INGLAN', 'Dental', false),
('RIALDENT', 'Dental', false),
('WELDING COPPER', 'Industrial', false),
('AISLAMIENTOS CARTEYA', 'Construcción', false),
('CUINA SOLUCIÓ', 'Alimentación', false),
('UNIFORMES LANCELOT SL', 'Textil', false),
('SCHELLHAMMER BUSINESS SCHOOL', 'Educación', false);

-- Now link empresas to mandatos
-- Proyecto Master <- SCHELLHAMMER BUSINESS SCHOOL
UPDATE mandatos SET empresa_principal_id = (SELECT id FROM empresas WHERE nombre = 'SCHELLHAMMER BUSINESS SCHOOL' LIMIT 1)
WHERE id = '3ca86822-c8c7-486e-9d71-3bdcb88d2a6e';

-- Proyecto Vestia <- UNIFORMES LANCELOT SL
UPDATE mandatos SET empresa_principal_id = (SELECT id FROM empresas WHERE nombre = 'UNIFORMES LANCELOT SL' LIMIT 1)
WHERE id = 'a1e06824-574d-4572-ab8c-28c2bf514b18';

-- Proyecto REY <- CUINA SOLUCIÓ
UPDATE mandatos SET empresa_principal_id = (SELECT id FROM empresas WHERE nombre = 'CUINA SOLUCIÓ' LIMIT 1)
WHERE id = '20bb1a4c-3d7b-4afc-b912-2232f17e02ac';

-- Proyecto Poli <- AISLAMIENTOS CARTEYA
UPDATE mandatos SET empresa_principal_id = (SELECT id FROM empresas WHERE nombre = 'AISLAMIENTOS CARTEYA' LIMIT 1)
WHERE id = 'c92bc22d-0ab2-4e70-b758-23e624c1c60b';

-- Proyecto Sonffa <- WELDING COPPER
UPDATE mandatos SET empresa_principal_id = (SELECT id FROM empresas WHERE nombre = 'WELDING COPPER' LIMIT 1)
WHERE id = '8e08d801-819f-46bf-b826-1c26115cf74a';

-- Proyecto True <- RIALDENT
UPDATE mandatos SET empresa_principal_id = (SELECT id FROM empresas WHERE nombre = 'RIALDENT' LIMIT 1)
WHERE id = '2c0af182-82be-44d3-b7f7-bad8acddf444';

-- Proyecto ATLAS <- DENTAL GONZALO Y LAGUNAS
UPDATE mandatos SET empresa_principal_id = (SELECT id FROM empresas WHERE nombre = 'DENTAL GONZALO Y LAGUNAS' LIMIT 1)
WHERE id = 'c3d1cd94-df0c-4830-926e-e161d10401cf';

-- Proyecto Shield <- EDIM VALLES
UPDATE mandatos SET empresa_principal_id = (SELECT id FROM empresas WHERE nombre = 'EDIM VALLES' LIMIT 1)
WHERE id = 'c48c6315-5d63-4346-b22e-a6bebaea20ff';

-- Proyecto Tierra <- EXCAVACIONS PETIT
UPDATE mandatos SET empresa_principal_id = (SELECT id FROM empresas WHERE nombre = 'EXCAVACIONS PETIT' LIMIT 1)
WHERE id = '020392d6-1997-4d9c-9b0a-485d39fd6be4';

-- Proyecto Destra <- FB INTEC
UPDATE mandatos SET empresa_principal_id = (SELECT id FROM empresas WHERE nombre = 'FB INTEC' LIMIT 1)
WHERE id = '8b7d781c-11f8-4343-bfdf-80ce32eab9e0';

-- Proyecto Tork <- ABACO SUYTEC SA
UPDATE mandatos SET empresa_principal_id = (SELECT id FROM empresas WHERE nombre = 'ABACO SUYTEC SA' LIMIT 1)
WHERE id = 'fbd96aee-507f-4241-8490-e5eb20bb4e51';

-- Proyecto CEDAR <- CLÍNICA PIZARRO MONTENEGRO
UPDATE mandatos SET empresa_principal_id = (SELECT id FROM empresas WHERE nombre = 'CLÍNICA PIZARRO MONTENEGRO' LIMIT 1)
WHERE id = '6430f0ca-b611-4bf1-a913-cad28b1cb75a';

-- Proyecto EYE <- LOUIS ARMANND OPTICS SL
UPDATE mandatos SET empresa_principal_id = (SELECT id FROM empresas WHERE nombre = 'LOUIS ARMANND OPTICS SL' LIMIT 1)
WHERE id = '8624718c-0fbe-4f71-8437-bc9a624a31c8';

-- Proyecto Ferro <- MATORFE SL
UPDATE mandatos SET empresa_principal_id = (SELECT id FROM empresas WHERE nombre = 'MATORFE SL' LIMIT 1)
WHERE id = '8734aa52-e929-4a1e-8173-e1b4e7035380';

-- Proyecto Demox <- EXARISER
UPDATE mandatos SET empresa_principal_id = (SELECT id FROM empresas WHERE nombre = 'EXARISER' LIMIT 1)
WHERE id = '3efcc5f4-5b01-4728-a0c3-770ed6ff7912';

-- Proyecto Malta <- BACUS BIER S.L
UPDATE mandatos SET empresa_principal_id = (SELECT id FROM empresas WHERE nombre = 'BACUS BIER S.L' LIMIT 1)
WHERE id = '735d9e93-9cf8-493b-85df-a1f7a8fca484';

-- Proyecto Stratalis <- MENYBER GLOBAL SERVICES
UPDATE mandatos SET empresa_principal_id = (SELECT id FROM empresas WHERE nombre = 'MENYBER GLOBAL SERVICES' LIMIT 1)
WHERE id = '5f2c02e9-319d-480e-b996-6ad609d173dd';

-- Proyecto Zircon <- VALLDURADENT
UPDATE mandatos SET empresa_principal_id = (SELECT id FROM empresas WHERE nombre = 'VALLDURADENT' LIMIT 1)
WHERE id = 'e36b0d8a-fa27-4e32-9f3e-1c719bfaf92f';

-- Proyecto DELTA <- MQ DENT
UPDATE mandatos SET empresa_principal_id = (SELECT id FROM empresas WHERE nombre = 'MQ DENT' LIMIT 1)
WHERE id = 'b3aea99f-f0e5-44c3-8f2a-5bea2d1c36e2';

-- Proyecto Sol <- ENERGYEAR
UPDATE mandatos SET empresa_principal_id = (SELECT id FROM empresas WHERE nombre = 'ENERGYEAR' LIMIT 1)
WHERE id = '6b66d75f-b2a2-4ead-b3d6-2fbcecf87e4b';

-- Proyecto Kappa <- COSAMO PACKAGING SL
UPDATE mandatos SET empresa_principal_id = (SELECT id FROM empresas WHERE nombre = 'COSAMO PACKAGING SL' LIMIT 1)
WHERE id = 'da2257cb-9fa7-4b7c-8bde-2f9be5488f70';

-- Proyecto Hidra <- AQUORE
UPDATE mandatos SET empresa_principal_id = (SELECT id FROM empresas WHERE nombre = 'AQUORE' LIMIT 1)
WHERE id = '72a3d92a-6873-43fc-8d85-aadf8c0420d5';

-- Proyecto Velo <- FASTER WEAR SL
UPDATE mandatos SET empresa_principal_id = (SELECT id FROM empresas WHERE nombre = 'FASTER WEAR SL' LIMIT 1)
WHERE id = '452648a7-e83a-4eea-87e0-785a556841f2';

-- Proyecto Manteno <- GEINSUR SERVICIOS INTEGRALES SL
UPDATE mandatos SET empresa_principal_id = (SELECT id FROM empresas WHERE nombre = 'GEINSUR SERVICIOS INTEGRALES SL' LIMIT 1)
WHERE id = '8775687e-2a79-4605-90f1-c28758a4ddb3';

-- Proyecto Haul <- COLABORA INGENERIOS
UPDATE mandatos SET empresa_principal_id = (SELECT id FROM empresas WHERE nombre = 'COLABORA INGENERIOS' LIMIT 1)
WHERE id = 'c83e9668-1214-4320-b291-17c3885c2f20';

-- Proyecto Aegis <- TUCSEGUR ALARMAS SL
UPDATE mandatos SET empresa_principal_id = (SELECT id FROM empresas WHERE nombre = 'TUCSEGUR ALARMAS SL' LIMIT 1)
WHERE id = 'edb30e1b-b9eb-4782-8212-4d1522a7e17a';

-- Proyecto CAE <- ADDINGPLUS
UPDATE mandatos SET empresa_principal_id = (SELECT id FROM empresas WHERE nombre = 'ADDINGPLUS' LIMIT 1)
WHERE id = 'c5be7fee-f619-4e5f-b0a1-3cbed00ad01a';