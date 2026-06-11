/**
 * ============================================================
 * SAFETRACK FSMS — Google Apps Script Backend v5.8.1
 * Palmary FOOD · FSSC 22000 / ISO 22000
 * ============================================================
 *
 * PRÉREQUIS (une seule fois) :
 *   Dans l'éditeur Apps Script :
 *   → Services (icône +) → Drive API → Version v2 → Ajouter
 *
 * Aucune clé API externe requise.
 * ============================================================
 */

// ============================================================
// CONFIGURATION
// ============================================================
const CONFIG = {
  SPREADSHEET_ID:         '1YaS8SxEKJVoi-j9DiCP7epNlznk2_sO4OPMwk6sRkdQ',
  DRIVE_FOLDER_ID:        '1SJJtlEdIfbEVEkByJVhdWBX6dHRrwYiA',
  COMPANY_NAME:           'Palmary FOOD.',
  APP_TITLE:              'SafeTrack FSMS',
  SESSION_DURATION_HOURS: 8,
  REPORT_ID_PREFIX:       'FS',
  ANONYMOUS_LABEL:        'Anonyme',
  RESOLVED_STATUSES:      ['CLOSED', 'VERIFIED', 'Resolved', 'Clôturé', 'Terminé'],
};

const SHEETS = {
  REPORTS:              'REPORTS',
  USERS:                'USERS',
  SETTINGS:             'SETTINGS',
  CAPA:                 'CAPA',
  AUDIT_LOGS:           'AUDIT_LOGS',
  RESPONSIBLES:         'RESPONSIBLES',
  SETTINGS_ZONES:       'SETTINGS_ZONES',
  SETTINGS_TYPES:       'SETTINGS_TYPES',
  SETTINGS_DEPARTMENTS: 'SETTINGS_DEPARTMENTS',
  SETTINGS_LOCATIONS:   'SETTINGS_LOCATIONS',
  SETTINGS_THEMES:      'SETTINGS_THEMES',
  SETTINGS_FORMATEURS:  'SETTINGS_FORMATEURS',
  SENSIBILISATION_MANUAL: 'SENSIBILISATION_MANUAL',
  ARCHIVE:              'ARCHIVE',
  EMPLOYEES:            'EMPLOYEES',
  QUIZ_QUESTIONS:       'QUIZ_QUESTIONS',
  QUIZ_RESPONSES:       'QUIZ_RESPONSES',
  PRP_HYGIENE:          'PRP_HYGIENE',
  PRP_CRITERIA:         'PRP_CRITERIA',
  FORMATION_SESSIONS:   'FORMATION_SESSIONS',
  FORMATION_PLAN:       'FORMATION_PLAN',
  POSTE_OBJECTIFS:      'POSTE_OBJECTIFS',
};

// ============================================================
// ROUTER — GET
// ============================================================
function doGet(e) {
  const page = (e && e.parameter && e.parameter.page) ? e.parameter.page : null;

  if (page === 'hub') {
    const tpl = HtmlService.createTemplateFromFile('hub');
    tpl.deploymentUrl = ScriptApp.getService().getUrl();
    return tpl.evaluate()
      .setTitle(CONFIG.APP_TITLE + ' — Accueil')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
  }

  if (page === 'index') {
    return HtmlService.createTemplateFromFile('index')
      .evaluate()
      .setTitle(CONFIG.APP_TITLE + ' — Déclarer un Incident | الإبلاغ عن حادث')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
  }

  if (page === 'sensibilis') {
    return HtmlService.createTemplateFromFile('sensibilis')
      .evaluate()
      .setTitle(CONFIG.APP_TITLE + ' — Sensibilisation')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
  }

  if (page === 'admin') {
    return HtmlService.createTemplateFromFile('admin')
      .evaluate()
      .setTitle(CONFIG.APP_TITLE + ' — Admin Dashboard')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
  }

  if (page === 'hygiene') {
    return HtmlService.createTemplateFromFile('hygiene')
      .evaluate()
      .setTitle(CONFIG.APP_TITLE + ' — PRP Hygiène & Santé Personnel')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
  }

  if (page === 'planformation') {
    const tpl = HtmlService.createTemplateFromFile('planformation');
    tpl.deploymentUrl = ScriptApp.getService().getUrl();
    return tpl.evaluate()
      .setTitle(CONFIG.APP_TITLE + ' — Plan de Formation')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
  }

  if (e && e.parameter && e.parameter.action) {
    try {
      ensureInitialized();
      return buildJsonResponse(routeGetAction(e.parameter.action, e.parameter));
    } catch (err) {
      Logger.log('doGet error: ' + err);
      return buildJsonResponse({ success: false, message: err.message });
    }
  }

  const tplHub = HtmlService.createTemplateFromFile('hub');
  tplHub.deploymentUrl = ScriptApp.getService().getUrl();
  return tplHub.evaluate()
    .setTitle(CONFIG.APP_TITLE + ' — Accueil | الصفحة الرئيسية')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}

function doPost(e) {
  try {
    ensureInitialized();
    let body = {};
    if (e.postData && e.postData.contents) {
      try { body = JSON.parse(e.postData.contents); } catch (pe) {
        return buildJsonResponse({ success: false, message: 'JSON invalide' });
      }
    }
    if (!body.action) return buildJsonResponse({ success: false, message: '`action` manquant' });
    return buildJsonResponse(routePostAction(body.action, body));
  } catch (err) {
    Logger.log('doPost error: ' + err);
    return buildJsonResponse({ success: false, message: err.message });
  }
}

// ============================================================
// ROUTE TABLES
// ============================================================
function routeGetAction(action, p) {
  switch (action) {
    case 'getDashboardKPIs':                return getDashboardKPIs();
    case 'getReports':                      return getReports({ status:p.status||null, severity:p.severity||null, department:p.department||null, zone:p.zone||null, dateFrom:p.dateFrom||null, dateTo:p.dateTo||null, search:p.search||null });
    case 'getReportById':                   return p.id ? getReportById(p.id) : { success:false, message:'`id` requis' };
    case 'getUsers':                        return getUsers();
    case 'getCAPAs':                        return getCAPAs(p.reportId||null);
    case 'exportCSV':                       return exportReportsCSV();
    case 'getSettings':                     return getSettings();
    case 'getResponsibles':                 return getResponsibles();
    case 'getSettingsList':                 return getSettingsList(p.type);
    case 'getAllDynamicSettings':           return getAllDynamicSettings();
    case 'findEmployeeByBadge':             return p.badge ? findEmployeeByBadge(p.badge) : { success:false, message:'`badge` requis' };
    case 'getDeclarationStats':             return getDeclarationStats();
    case 'getResponsiblesList':             return getResponsiblesList();
    case 'getZoneParetoData':               return getZoneParetoData();
    case 'getAdminStatsData':               return getAdminStatsData();
    case 'getSensibilisationData':          return getSensibilisationData();
    case 'getSensibilisationConfig':        return getSensibilisationConfig();
    case 'getThemesList':                   return getThemesList();
    case 'getFormateursList':               return getFormateursList();
    case 'getSensibilisationStats':         return getSensibilisationStats();
    case 'getSensibilisationAdminData':     return getSensibilisationAdminData();
    case 'getDeploymentUrl':                return getDeploymentUrl();
    case 'getEmployeeSensibilisationHistory':
      return p.badge
        ? getEmployeeSensibilisationHistory(p.badge)
        : { success: false, message: '`badge` requis' };
    case 'getEmployeeQuizHistory':
      return p.badge
        ? getEmployeeQuizHistory(p.badge)
        : { success: false, message: '`badge` requis' };
    case 'getEmployeeFullHistory':
      return p.badge
        ? getEmployeeFullHistory(p.badge)
        : { success: false, message: '`badge` requis' };
    case 'getQuizByTheme':
      return p.theme
        ? getQuizByTheme(p.theme, Number(p.limit) || 10, p.level || '')
        : { success: false, message: '`theme` requis' };
    case 'getQuizStats':
      return getQuizStats();
    case 'getQuizTimerConfig':
      return getQuizTimerConfig();
    case 'getHygieneAdvancedStats':
      return getHygieneAdvancedStats(p || {});
    case 'getQuizQuestions':
      return getQuizQuestions(p.theme || null);
    case 'getHygienePrpData':
      return getHygienePrpData({
        empBadge:  p.empBadge  || null,
        verName:   p.verName   || null,
        shift:     p.shift     || null,
        zone:      p.zone      || null,
        severity:  p.severity  || null,
        status:    p.status    || null,
        dateFrom:  p.dateFrom  || null,
        dateTo:    p.dateTo    || null,
        search:    p.search    || null,
      });
    case 'getHygieneKpis':
      return getHygieneKpis();
    case 'getEmployeeHygieneHistory':
      return p.badge
        ? getEmployeeHygieneHistory(p.badge)
        : { success: false, message: '`badge` requis' };
    case 'exportHygieneCSV':
      return exportHygieneCSV();
    case 'getPrpCriteria':
      return getPrpCriteria();
    case 'getFormationData':    return getFormationData(p.year ? Number(p.year) : null);
    case 'getFormationSessions':return getFormationSessions(p.year ? Number(p.year) : null);
    case 'getFormationKPIs':    return getFormationKPIs();
    case 'getSensibilisationSessionDetail': return getSensibilisationSessionDetail(p.sessionId);
    case 'getPastSensibilisationSessions': return { success:true, data:getPastSensibilisationSessions() };
    case 'installRecyclageDailyTrigger':    return installRecyclageDailyTrigger();
    case 'getPosteObjectifs':        return getPosteObjectifs();
    case 'getPosteRequiredThemes':   return getPosteRequiredThemes(p.badge || '');
    case 'getAllEmployees':          return getAllEmployees();
    default: return { success:false, message:'Action GET inconnue: '+action };
  }
}

function routePostAction(action, body) {
  switch (action) {
    case 'authenticate':              return authenticateUser(body.username, body.password);
    case 'logout':                    return logout(body.token||'');
    case 'submitReport':              return submitReport(body.formData);
    case 'updateReport':              return updateReport(body.reportId, body.updates, body.userEmail||'');
    case 'deleteReport':              return deleteReport(body.reportId, body.userEmail||'');
    case 'createReport':              return createReportManual(body.formData, body.userEmail||'');
    case 'createCAPA':                return createCAPA(body.capaData, body.userEmail||'');
    case 'saveResponsible':           return saveResponsible(body.data, body.userEmail||'');
    case 'deleteResponsible':         return deleteResponsible(body.id, body.userEmail||'');
    case 'saveSettingItem':           return saveSettingItem(body.type, body.data, body.userEmail||'');
    case 'deleteSettingItem':         return deleteSettingItem(body.type, body.id, body.userEmail||'');
    case 'saveSetting':               return saveSetting(body.key, body.value);
    case 'updateIncidentFromAdmin':
      return updateIncidentFromAdmin(
        body.reportId, body.responsibleName,
        body.status, body.rootCause, body.userEmail||'ADMIN'
      );
    case 'promoteToCapaSystem':       return promoteToCapaSystem(body.reportId);
    case 'submitSensibilisation':
      return submitSensibilisation(
        body.theme, body.animateur,
        body.badgeList       || [],
        body.imageData       || null,
        body.dateVal         || null,
        body.manualEntries   || [],
        body.attachmentsData || []
      );
    case 'saveTheme':                 return saveTheme(body.data, body.userEmail||'');
    case 'deleteTheme':               return deleteTheme(body.id, body.userEmail||'');
    case 'saveFormateur':             return saveFormateur(body.data, body.userEmail||'');
    case 'deleteFormateur':           return deleteFormateur(body.id, body.userEmail||'');
    case 'submitQuizAnswers':
      return submitQuizAnswers(
        body.badge, body.sessionId, body.correctCount,
        body.totalQ, body.animateur, body.details || [],
        body.testType || 'chaud', body.level || ''
      );
    case 'saveQuizQuestion':
      return saveQuizQuestion(body.data, body.userEmail || 'ADMIN');
    case 'updateQuizQuestionStatus':
      return updateQuizQuestionStatus(body.questionId, body.status, body.userEmail || 'ADMIN');
    case 'deleteQuizQuestion':
      return deleteQuizQuestion(body.questionId, body.userEmail || 'ADMIN');
    case 'initQuizSheets':
      return initQuizSheets();
    case 'saveQuizTimerConfig':
      return saveQuizTimerConfig(body.enabled, body.seconds, body.userEmail||'ADMIN');
    case 'deleteQuizResponse':
      return deleteQuizResponse(body.sessionId, body.userEmail||'ADMIN');
    case 'addManualQuizResponse':
      return addManualQuizResponse(body.data||{}, body.userEmail||'ADMIN');
    case 'getHygieneAdvancedStats':
      return getHygieneAdvancedStats(body.filters||{});
    case 'uploadQuizQuestionImage':
      return uploadQuizQuestionImage(body.base64Data, body.questionId || '');
    case 'createUser':
      return createUser(body.userData, body.userEmail || 'ADMIN');
    case 'submitPrpHygiene':
      return submitPrpHygiene(body.formData);
    case 'updateHygieneStatus':
      return updateHygieneStatus(body.checklistId, body.status, body.userEmail || 'ADMIN');
    case 'getHygienePrpData':
      return getHygienePrpData({
        empBadge: body.empBadge || null,
        verName:  body.verName  || null,
        shift:    body.shift    || null,
        zone:     body.zone     || null,
        severity: body.severity || null,
        status:   body.status   || null,
        dateFrom: body.dateFrom || null,
        dateTo:   body.dateTo   || null,
        search:   body.search   || null,
      });
    case 'getHygieneKpis':
      return getHygieneKpis();
    case 'getEmployeeHygieneHistory':
      return body.badge
        ? getEmployeeHygieneHistory(body.badge)
        : { success: false, message: '`badge` requis' };
    case 'exportHygieneCSV':
      return exportHygieneCSV();
    case 'createPrpRecord':       return createPrpRecord(body);
    case 'updatePrpRecord':       return updatePrpRecord(body);
    case 'deletePrpRecord':
      return body.checklistId
        ? deletePrpRecord(body.checklistId, body.userEmail || 'ADMIN')
        : { success:false, message:'`checklistId` requis' };
    case 'savePrpCriterion':      return savePrpCriterion(body);
    case 'deletePrpCriterion':    return deletePrpCriterion(body);
    case 'addFormationSession':    return addFormationSession(body.session, body.userEmail || 'PLAN');
    case 'saveGeneratedPlan':      return saveGeneratedPlan(body.plan || [], body.year || new Date().getFullYear());
    case 'updateFormationSession': return updateFormationSession(body.session, body.userEmail || 'PLAN');
    case 'deleteFormationSession': return deleteFormationSession(body.sessionId, body.userEmail || 'PLAN');
    case 'changeUserPassword':       return changeUserPassword(body.userId, body.newPassword, body.userEmail||'ADMIN');
    case 'deleteUser':                return deleteUser(body.userId, body.userEmail||'ADMIN');
    case 'savePosteObjectif':         return savePosteObjectif(body.data || {}, body.userEmail || 'ADMIN');
    case 'deletePosteObjectif':       return deletePosteObjectif(body.poste, body.userEmail || 'ADMIN');
    case 'setEmployeePoste':          return setEmployeePoste(body.badge, body.poste, body.userEmail || 'ADMIN');

    default: return { success:false, message:'Action POST inconnue: '+action };
  }
}

function buildJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// INITIALIZATION
// ============================================================
function ensureInitialized() {
  const ss    = getSpreadsheet();
  const names = ss.getSheets().map(s => s.getName());
  if (Object.values(SHEETS).some(n => !names.includes(n))) initializeSystem();
}

function initializeSystem() {
  const ss = getSpreadsheet();
  createSheetIfNotExists(ss, SHEETS.REPORTS,              getReportHeaders());
  createSheetIfNotExists(ss, SHEETS.USERS,                getUserHeaders());
  createSheetIfNotExists(ss, SHEETS.SETTINGS,             getSettingsHeaders());
  createSheetIfNotExists(ss, SHEETS.CAPA,                 getCAPAHeaders());
  createSheetIfNotExists(ss, SHEETS.AUDIT_LOGS,           getAuditHeaders());
  createSheetIfNotExists(ss, SHEETS.RESPONSIBLES,         getResponsibleHeaders());
  createSheetIfNotExists(ss, SHEETS.SETTINGS_ZONES,       getSettingItemHeaders());
  createSheetIfNotExists(ss, SHEETS.SETTINGS_TYPES,       getSettingItemHeaders());
  createSheetIfNotExists(ss, SHEETS.SETTINGS_DEPARTMENTS, getSettingItemHeaders());
  createSheetIfNotExists(ss, SHEETS.SETTINGS_LOCATIONS,   getSettingItemHeaders());
  createSheetIfNotExists(ss, SHEETS.SETTINGS_THEMES,      getSettingItemHeaders());
  createSheetIfNotExists(ss, SHEETS.SETTINGS_FORMATEURS,  getSettingItemHeaders());
  createSheetIfNotExists(ss, SHEETS.ARCHIVE,              getReportHeaders());
  createSheetIfNotExists(ss, SHEETS.EMPLOYEES,            getEmployeeHeaders());
  createSheetIfNotExists(ss, SHEETS.SENSIBILISATION_MANUAL, getSensibilisationManualHeaders());
  createSheetIfNotExists(ss, SHEETS.QUIZ_QUESTIONS, getQuizQuestionHeaders());
  createSheetIfNotExists(ss, SHEETS.POSTE_OBJECTIFS, getPosteObjectifsHeaders());
  createSheetIfNotExists(ss, SHEETS.QUIZ_RESPONSES,  getQuizResponseHeaders());
  createSheetIfNotExists(ss, SHEETS.PRP_HYGIENE,       getHygienePrpHeaders());
  createSheetIfNotExists(ss, SHEETS.PRP_CRITERIA,      getPrpCriteriaHeaders());
  createSheetIfNotExists(ss, SHEETS.FORMATION_SESSIONS, getFormationSessionHeaders());
  createSheetIfNotExists(ss, SHEETS.FORMATION_PLAN,     getFormationPlanHeaders());

  const usersSheet = ss.getSheetByName(SHEETS.USERS);
  if (usersSheet.getLastRow() <= 1) createDefaultAdmin(usersSheet);

  seedDefaultSettings(ss);
  seedDefaultEmployees(ss);
  seedDefaultResponsibles(ss);
  seedDefaultThemesAndFormateurs(ss);

  try { initializeDriveFolders(); } catch(e) { Logger.log('Drive init: '+e); }
  Logger.log('SafeTrack v5.8.1 initialized.');
  return { success:true, message:'System initialized v5.8.1' };
}

function createSheetIfNotExists(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setBackground('#1a3c5e').setFontColor('#ffffff').setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// ============================================================
// HEADER DEFINITIONS
// ============================================================
function getReportHeaders()      { return ['REPORT_ID','TIMESTAMP','EMPLOYEE_NAME','DEPARTMENT','ZONE','PRODUCTION_LINE','INCIDENT_TYPE','SEVERITY','DESCRIPTION','IMMEDIATE_ACTION','PHOTO_URL','STATUS','ASSIGNED_TO','ROOT_CAUSE','CORRECTIVE_ACTION','PREVENTIVE_ACTION','VERIFICATION_DATE','VERIFIED_BY','CLOSURE_DATE','CLOSED_BY','CAPA_ID','LANGUAGE','COMMENTS','UUID']; }
function getUserHeaders()        { return ['USER_ID','USERNAME','PASSWORD_HASH','STATUS','ROLE','FULL_NAME','EMAIL','DEPARTMENT','LAST_LOGIN','CREATED_DATE']; }
function getSettingsHeaders()    { return ['KEY','VALUE','DESCRIPTION','UPDATED_DATE']; }
function getCAPAHeaders()        { return ['CAPA_ID','INCIDENT_ID','DATE_PROMOTION','ZONE_LIGNE','DESCRIPTION','STATUT_CAPA','ACTION_CORRECTIVE','ACTION_PREVENTIVE','COMMENTAIRES']; }
function getAuditHeaders()       { return ['TIMESTAMP','ACTION','ENTITY_ID','USER_ID','DETAILS','SESSION_USER']; }
function getSettingItemHeaders() { return ['ID','NAME','STATUS','CREATED_DATE']; }
function getResponsibleHeaders() { return ['ID','FULL_NAME','DEPARTMENT','EMAIL','WHATSAPP','ZONE','INCIDENT_TYPE','PRIORITY','STATUS','CREATED_DATE']; }
function getEmployeeHeaders()    { return ['BADGE','FULL_NAME','DEPARTMENT','POSTE']; }
function getPosteObjectifsHeaders(){ return ['POSTE','THEMES','STATUS','UPDATED_AT','UPDATED_BY']; }
function getSensibilisationManualHeaders() { return ['DATE','THEME','ANIMATEUR','BADGE','NOM','DEPT','CELL_VALUE']; }
function getQuizQuestionHeaders() {
  return [
    'QUESTION_ID','THEME','QUESTION_TEXT',
    'OPTION_A','OPTION_B','OPTION_C','OPTION_D',
    'CORRECT','TYPE','EXPLICATION','STATUS','IMAGE_URL',
    'LEVEL','QUESTION_TEXT_AR','OPTION_A_AR','OPTION_B_AR','OPTION_C_AR','OPTION_D_AR'
  ];
}
function getQuizResponseHeaders() {
  return [
    'RESPONSE_ID','SESSION_ID','BADGE','EMPLOYEE_NAME',
    'THEME','SCORE','SCORE_PCT','CORRECT_COUNT','TOTAL_Q',
    'DETAILS','TIMESTAMP','ANIMATEUR','TEST_TYPE','DEPARTMENT','LEVEL'
  ];
}

// ============================================================
// SEED DATA
// ============================================================
function seedDefaultThemesAndFormateurs(ss) {
  const themesSheet = ss.getSheetByName(SHEETS.SETTINGS_THEMES);
  if (themesSheet && themesSheet.getLastRow() <= 1) {
    const defaultThemes = [
      'Food safety sensibilisation',
      'Hygiène du personnel',
      'Sécurité au travail',
      'Gestion des allergènes',
      'Bonnes pratiques de fabrication',
      'Nettoyage et désinfection',
      'Traçabilité produits',
    ];
    defaultThemes.forEach((t, i) => {
      themesSheet.appendRow(['TH-' + String(i+1).padStart(3,'0'), t, 'active', new Date()]);
    });
  }

  const formateursSheet = ss.getSheetByName(SHEETS.SETTINGS_FORMATEURS);
  if (formateursSheet && formateursSheet.getLastRow() <= 1) {
    const defaultFormateurs = [
      'Responsable Qualité',
      'Responsable HSE',
      'Chef de Production',
      'Consultant Externe',
    ];
    defaultFormateurs.forEach((f, i) => {
      formateursSheet.appendRow(['FM-' + String(i+1).padStart(3,'0'), f, 'active', new Date()]);
    });
  }
}

function seedDefaultSettings(ss) {
  const zonesSheet = ss.getSheetByName(SHEETS.SETTINGS_ZONES);
  if (zonesSheet.getLastRow() <= 1) {
    const zones = ['Zone A - Réception','Zone B - Transformation','Zone C - Conditionnement','Zone D - Stockage','Zone E - Expédition','Zone F - Maintenance','Zone G - Laboratoire'];
    zones.forEach((z,i) => zonesSheet.appendRow(['ZN-'+String(i+1).padStart(3,'0'), z, 'active', new Date()]));
  }
  const typesSheet = ss.getSheetByName(SHEETS.SETTINGS_TYPES);
  if (typesSheet.getLastRow() <= 1) {
    const types = ['Contamination physique','Contamination chimique','Contamination biologique','Non-conformité produit',"Défaut d'hygiène personnel",'Défaillance équipement','Non-respect procédure','Problème température','Étiquetage incorrect','Corps étranger','Nuisibles','Autre'];
    types.forEach((t,i) => typesSheet.appendRow(['TY-'+String(i+1).padStart(3,'0'), t, 'active', new Date()]));
  }
  const deptsSheet = ss.getSheetByName(SHEETS.SETTINGS_DEPARTMENTS);
  if (deptsSheet.getLastRow() <= 1) {
    const depts = ['Production','Qualité','Maintenance','Logistique','Conditionnement','Réception','Expédition'];
    depts.forEach((d,i) => deptsSheet.appendRow(['DP-'+String(i+1).padStart(3,'0'), d, 'active', new Date()]));
  }
  const locsSheet = ss.getSheetByName(SHEETS.SETTINGS_LOCATIONS);
  if (locsSheet.getLastRow() <= 1) {
    const locs = ['Ligne 1','Ligne 2','Ligne 3','Zone de stockage froid','Zone de stockage sec','Quai de chargement'];
    locs.forEach((l,i) => locsSheet.appendRow(['LC-'+String(i+1).padStart(3,'0'), l, 'active', new Date()]));
  }
}

function seedDefaultEmployees(ss) {
  const sheet = ss.getSheetByName(SHEETS.EMPLOYEES);
  if (sheet && sheet.getLastRow() <= 1) {
    const employees = [
      ['1001','Mohamed Amine Boulechbak','Production'],
      ['1002','Fatima Zahra Benali','Qualité'],
      ['1003','Karim Hadj-Ahmed','Maintenance'],
      ['1004','Rachid Oussama','Conditionnement'],
      ['1005','Nawal Cheriet','Réception'],
      ['1006','Hamza Benmoussa','Production'],
      ['1007','Sara Meziane','Logistique'],
      ['1008','Omar Belkacem','Expédition'],
    ];
    employees.forEach(row => sheet.appendRow(row));
    if (sheet.getLastRow() > 1) {
      sheet.getRange(2, 1, sheet.getLastRow()-1, 1).setNumberFormat('@');
    }
  }
}

function seedDefaultResponsibles(ss) {
  const sheet = ss.getSheetByName(SHEETS.RESPONSIBLES);
  if (sheet && sheet.getLastRow() <= 1) {
    const rows = [
      ['RSP-001','Fatima Zahra Benali','Responsable Qualité','fz.benali@palmary.dz','+213551234567','ALL','ALL','High','active',new Date()],
      ['RSP-002','Karim Hadj-Ahmed','Responsable Maintenance','k.hadj@palmary.dz','+213669876543','Zone B - Transformation','Défaillance équipement','Medium','active',new Date()],
      ['RSP-003','Mohamed Amine Boulechbak','Chef de Production','m.boulechbak@palmary.dz','+213770001234','ALL','ALL','High','active',new Date()],
    ];
    rows.forEach(r => sheet.appendRow(r));
  }
}

// ============================================================
// SENSIBILISATION HISTORY
// ============================================================
function getEmployeeSensibilisationHistory(badgeNumber) {
  try {
    if (!badgeNumber || String(badgeNumber).trim() === '')
      return { success: false, message: 'Badge manquant.' };

    const ss    = getSpreadsheet();
    const badge = String(badgeNumber).trim().replace(/\.0+$/, '').replace(/^0+([0-9]+)$/,'$1');
    const history  = [];

    const empSheet = ss.getSheetByName(SHEETS.EMPLOYEES);
    if (empSheet && empSheet.getLastRow() > 1) {
      const data    = empSheet.getDataRange().getValues();
      const headers = data[0].map(h => String(h).trim());
      const BASE_COLS = 3;

      let employeeRow = null;
      for (let r = 1; r < data.length; r++) {
        const rowBadge = String(data[r][0] || '').trim().replace(/\.0+$/, '').replace(/^0+([0-9]+)$/,'$1');
        if (rowBadge === badge) { employeeRow = data[r]; break; }
      }

      if (employeeRow) {
        for (let c = BASE_COLS; c < headers.length; c++) {
          const cellVal = String(employeeRow[c] || '').trim();
          if (!cellVal) continue;
          const colName = headers[c];

          if (cellVal.toLowerCase().startsWith('sensibil')) {
            let date = '—', formateur = '—';
            const match = cellVal.match(/Sensibilisé le\s+(\d{2}\/\d{2}\/\d{2})\s+par\s+(.+)/i);
            if (match) { date = match[1]; formateur = match[2].trim(); }
            history.push({ theme: colName, date, formateur, source: 'EMPLOYEES' });
          }
        }
      }
    }

    const manSheet = ss.getSheetByName(SHEETS.SENSIBILISATION_MANUAL);
    if (manSheet && manSheet.getLastRow() > 1) {
      const manData = manSheet.getDataRange().getValues();
      const pad     = n => String(n).padStart(2, '0');
      for (let i = 1; i < manData.length; i++) {
        const rowBadge = String(manData[i][3] || '').trim().replace(/\.0+$/, '').replace(/^0+([0-9]+)$/,'$1');
        if (rowBadge !== badge) continue;
        const rawDate   = manData[i][0];
        const theme     = String(manData[i][1] || '').trim();
        const formateur = String(manData[i][2] || '').trim();
        let dateStr = '—';
        if (rawDate instanceof Date && !isNaN(rawDate)) {
          dateStr = pad(rawDate.getDate()) + '/' + pad(rawDate.getMonth() + 1) + '/' + String(rawDate.getFullYear()).slice(-2);
        } else if (rawDate) {
          dateStr = String(rawDate).slice(0, 10);
        }
        history.push({ theme, date: dateStr, formateur, source: 'MANUAL' });
      }
    }

    history.sort((a, b) => {
      if (a.date === '—') return 1;
      if (b.date === '—') return -1;
      const toSort = d => { const p = d.split('/'); return p.length === 3 ? p[2]+p[1]+p[0] : d; };
      return toSort(b.date).localeCompare(toSort(a.date));
    });

    return { success: true, history };
  } catch (err) {
    Logger.log('getEmployeeSensibilisationHistory error: ' + err);
    return { success: false, message: err.message };
  }
}

// ============================================================
// QUIZ HISTORY PAR EMPLOYÉ
// ============================================================
function getEmployeeQuizHistory(badgeNumber) {
  try {
    if (!badgeNumber || String(badgeNumber).trim() === '')
      return { success: false, message: 'Badge manquant.' };

    const ss    = getSpreadsheet();
    const badge = String(badgeNumber).trim().replace(/\.0+$/, '').replace(/^0+([0-9]+)$/,'$1');
    const quizzes = [];

    const sheet = ss.getSheetByName(SHEETS.QUIZ_RESPONSES);
    if (sheet && sheet.getLastRow() > 1) {
      const data    = sheet.getDataRange().getValues();
      const headers = data[0].map(h => String(h).trim().toUpperCase());
      const idx = name => headers.indexOf(name);
      const cBadge = idx('BADGE'), cTheme = idx('THEME'), cScore = idx('SCORE'),
            cPct = idx('SCORE_PCT'), cCorrect = idx('CORRECT_COUNT'), cTotal = idx('TOTAL_Q'),
            cTs = idx('TIMESTAMP'), cAnim = idx('ANIMATEUR'), cType = idx('TEST_TYPE');
      const pad = n => String(n).padStart(2, '0');

      for (let i = 1; i < data.length; i++) {
        try {
          const rowBadge = String(data[i][cBadge] || '').trim().replace(/\.0+$/, '').replace(/^0+([0-9]+)$/,'$1');
          if (rowBadge !== badge) continue;

          let dateStr = '—';
          const rawDate = cTs >= 0 ? data[i][cTs] : '';
          if (rawDate instanceof Date && !isNaN(rawDate)) {
            dateStr = pad(rawDate.getDate()) + '/' + pad(rawDate.getMonth() + 1) + '/' + String(rawDate.getFullYear()).slice(-2);
          } else if (rawDate) {
            dateStr = String(rawDate).slice(0, 10);
          }

          let pct = null;
          try {
            const rawPct = cPct >= 0 ? data[i][cPct] : '';
            if (rawPct !== '' && rawPct !== null && rawPct !== undefined) {
              const n = Number(rawPct);
              if (!isNaN(n)) pct = Math.round(n);
            }
          } catch(pe) {}

          quizzes.push({
            theme:     cTheme   >= 0 ? String(data[i][cTheme]   || '').trim() : '',
            score:     cScore   >= 0 ? String(data[i][cScore]   || '')        : '',
            pct:       pct,
            correct:   cCorrect >= 0 ? String(data[i][cCorrect] || '')        : '',
            total:     cTotal   >= 0 ? String(data[i][cTotal]   || '')        : '',
            date:      dateStr,
            animateur: cAnim    >= 0 ? String(data[i][cAnim]    || '').trim() : '',
            testType:  cType    >= 0 ? String(data[i][cType]    || '').trim() : ''
          });
        } catch(rowErr) {
          Logger.log('getEmployeeQuizHistory row ' + i + ' error: ' + rowErr);
        }
      }
    }

    quizzes.sort((a, b) => {
      if (a.date === '—') return 1;
      if (b.date === '—') return -1;
      const toSort = d => { const p = d.split('/'); return p.length === 3 ? p[2]+p[1]+p[0] : d; };
      return toSort(b.date).localeCompare(toSort(a.date));
    });

    return { success: true, quizzes };
  } catch (err) {
    Logger.log('getEmployeeQuizHistory error: ' + err);
    return { success: false, message: err.message };
  }
}

// ============================================================
// HISTORIQUE COMPLET (Sensibilisation + Quiz) en un seul appel
// ============================================================
function getEmployeeFullHistory(badgeNumber) {
  if (!badgeNumber || String(badgeNumber).trim() === '')
    return { success: false, message: 'Badge manquant.' };

  let history = [];
  let quizzes = [];

  try {
    const sensRes = getEmployeeSensibilisationHistory(badgeNumber);
    if (sensRes && sensRes.success && sensRes.history) history = sensRes.history;
  } catch (e) {
    Logger.log('getEmployeeFullHistory [sens] error: ' + e);
  }

  try {
    const quizRes = getEmployeeQuizHistory(badgeNumber);
    if (quizRes && quizRes.success && quizRes.quizzes) quizzes = quizRes.quizzes;
  } catch (e) {
    Logger.log('getEmployeeFullHistory [quiz] error: ' + e);
  }

  Logger.log('getEmployeeFullHistory badge=' + badgeNumber + ' → history=' + history.length + ' quizzes=' + quizzes.length);
  return { success: true, history, quizzes };
}

// ============================================================
// SUBMIT SENSIBILISATION
// ============================================================
function submitSensibilisation(theme, animateur, badgeList, imageData, dateVal, manualEntries, attachmentsData) {
  try {
    if (!theme || !theme.trim())
      return { success: false, message: 'Le thème est obligatoire.' };
    if (!animateur || !animateur.trim())
      return { success: false, message: "L'animateur est obligatoire." };

    const totalBadges = (badgeList    || []).length;
    const totalManual = (manualEntries|| []).length;
    if (!totalBadges && !totalManual)
      return { success: false, message: 'Aucun participant fourni.' };

    const ss    = getSpreadsheet();
    const sheet = ss.getSheetByName(SHEETS.EMPLOYEES);
    if (!sheet) return { success: false, message: 'Feuille EMPLOYEES introuvable.' };

    let sessionDate = new Date();
    if (dateVal) {
      const parsed = new Date(dateVal);
      if (!isNaN(parsed)) sessionDate = parsed;
    }
    const pad     = n => String(n).padStart(2, '0');
    const yy      = String(sessionDate.getFullYear()).slice(-2);
    const dateStr = pad(sessionDate.getDate()) + '/' + pad(sessionDate.getMonth() + 1) + '/' + yy;
    const cellVal = 'Sensibilisé le ' + dateStr + ' par ' + animateur.trim();

    let lastCol    = sheet.getLastColumn();
    const headers  = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h).trim());
    let themeColIdx = headers.indexOf(theme.trim());

    if (themeColIdx < 0) {
      const newColNum = lastCol + 1;
      sheet.getRange(1, newColNum).setValue(theme.trim());
      sheet.getRange(1, newColNum).setBackground('#1a3c5e').setFontColor('#ffffff').setFontWeight('bold');
      themeColIdx = newColNum - 1;
      lastCol     = newColNum;
    }
    const themeColNum = themeColIdx + 1;

    const lastRow  = sheet.getLastRow();
    const badgeMap = {};
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, 1).getValues().forEach((row, i) => {
        const b = String(row[0] || '').trim().replace(/\.0+$/, '').replace(/^0+([0-9]+)$/,'$1');
        if (b) badgeMap[b] = i + 2;
      });
    }

    const ignored = [];
    let   updated = 0;

    (badgeList || []).forEach(badge => {
      const b = String(badge || '').trim().replace(/\.0+$/, '').replace(/^0+([0-9]+)$/,'$1');
      if (!b) return;
      const rowNum = badgeMap[b];
      if (!rowNum) { ignored.push(b); return; }
      sheet.getRange(rowNum, themeColNum).setValue(cellVal);
      updated++;
    });

    const manSheet    = ss.getSheetByName(SHEETS.SENSIBILISATION_MANUAL);
    let   manualCount = 0;

    (manualEntries || []).forEach(entry => {
      const badgeRaw = String(entry.badge || '').trim().replace(/\.0+$/, '').replace(/^0+([0-9]+)$/,'$1');
      const name     = String(entry.name       || '').trim();
      const dept     = String(entry.department || '—').trim();
      if (!name) return;

      if (badgeRaw) {
        if (!badgeMap[badgeRaw]) {
          sheet.appendRow([badgeRaw, name, dept]);
          const newRow = sheet.getLastRow();
          sheet.getRange(newRow, 1).setNumberFormat('@');
          const currentLastCol  = sheet.getLastColumn();
          const currentHeaders  = sheet.getRange(1, 1, 1, currentLastCol).getValues()[0].map(h => String(h).trim());
          const col = currentHeaders.indexOf(theme.trim()) + 1;
          if (col > 0) sheet.getRange(newRow, col).setValue(cellVal);
          badgeMap[badgeRaw] = newRow;
        } else {
          sheet.getRange(badgeMap[badgeRaw], themeColNum).setValue(cellVal);
        }
      }

      if (manSheet) {
        manSheet.appendRow([
          sessionDate, theme.trim(), animateur.trim(),
          badgeRaw, name, dept, cellVal
        ]);
      }

      manualCount++;
      updated++;
    });

    let evidenceUrl  = '';
    const evidenceUrls = [];
    const allFiles = (attachmentsData && attachmentsData.length)
      ? attachmentsData
      : (imageData && imageData.length > 100 ? [{ type: 'image', base64: imageData, name: 'photo.jpg' }] : []);

    allFiles.forEach((att, idx) => {
      try {
        const url = _uploadSensibilisationAttachment(att, theme.trim(), sessionDate, idx);
        evidenceUrls.push(url);
        if (!evidenceUrl) evidenceUrl = url;
      } catch (pe) {
        Logger.log('Attachment upload failed [' + idx + ']: ' + pe);
      }
    });

    logAudit(
      'SENSIBILISATION_SUBMITTED',
      'THEME:' + theme.trim(),
      animateur.trim(),
      'Réguliers: '  + (badgeList || []).join(',') +
      ' | Manuels: ' + (manualEntries || []).map(e => e.badge).join(',') +
      ' | Mis à jour: ' + updated +
      ' | Ignorés: ' + ignored.join(',') +
      ' | Fichiers: ' + evidenceUrls.length +
      (evidenceUrl ? ' | Evidence: ' + evidenceUrl : '')
    );

    // ── NEW: mirror this sensibilisation into FORMATION_SESSIONS for calendar ──
    const bridgedId = _bridgeSensibilisationToFormationSession_({
      theme, animateur, badgeList, manualEntries,
      dateVal, evidenceUrl
    });

    return {
      success:     true,
      updated,
      ignored,
      manualCount,
      evidenceUrl,
      evidenceUrls,
      sessionId:   bridgedId,
      calendarEvent: {
        id:           bridgedId,
        date:         dateVal,
        theme:        theme.trim(),
        trainer:      animateur.trim(),
        participants: (badgeList || []).concat(
                        (manualEntries || []).map(e => e.badge || e.name)
                      ),
        status:       'done',
        photoUrl:     evidenceUrl || ''
      },
      message: updated + ' participant(s) enregistré(s) pour "' + theme.trim() + '".'
    };
  } catch (err) {
    Logger.log('submitSensibilisation error: ' + err);
    return { success: false, message: err.message };
  }
}

// ============================================================
// SENSIBILISATION CONFIG
// ============================================================
function getSensibilisationConfig() {
  try {
    const ss = getSpreadsheet();

    const themesSheet = ss.getSheetByName(SHEETS.SETTINGS_THEMES);
    const themes = [];
    if (themesSheet && themesSheet.getLastRow() > 1) {
      const tData = themesSheet.getDataRange().getValues();
      for (let i = 1; i < tData.length; i++) {
        const status = String(tData[i][2] || '').trim().toLowerCase();
        if (!tData[i][0] || status === 'deleted' || status === 'inactive') continue;
        themes.push({ id: String(tData[i][0]).trim(), name: String(tData[i][1]).trim() });
      }
    }

    const fmSheet = ss.getSheetByName(SHEETS.SETTINGS_FORMATEURS);
    const formateurs = [];
    if (fmSheet && fmSheet.getLastRow() > 1) {
      const fData = fmSheet.getDataRange().getValues();
      for (let i = 1; i < fData.length; i++) {
        const status = String(fData[i][2] || '').trim().toLowerCase();
        if (!fData[i][0] || status === 'deleted' || status === 'inactive') continue;
        formateurs.push({ id: String(fData[i][0]).trim(), name: String(fData[i][1]).trim() });
      }
    }

    // ── Quiz timer config (managed via SETTINGS sheet) ──
    var quizTimer = { enabled: true, seconds: 30 };
    try {
      var setSh = ss.getSheetByName(SHEETS.SETTINGS);
      if (setSh && setSh.getLastRow() > 1) {
        var sData = setSh.getDataRange().getValues();
        for (var k = 1; k < sData.length; k++) {
          var key = String(sData[k][0]||'').trim();
          var val = String(sData[k][1]||'').trim();
          if (key === 'QUIZ_TIMER_ENABLED') quizTimer.enabled = !(val === '0' || val.toLowerCase() === 'false' || val.toLowerCase() === 'off');
          if (key === 'QUIZ_TIMER_SECONDS') { var n = parseInt(val,10); if (!isNaN(n) && n >= 5 && n <= 300) quizTimer.seconds = n; }
        }
      }
    } catch(e) {}

    return { success: true, themes, formateurs, quizTimer };
  } catch (err) {
    Logger.log('getSensibilisationConfig error: ' + err);
    return { success: false, message: err.message, themes: [], formateurs: [], quizTimer: { enabled:true, seconds:30 } };
  }
}

function getThemesList() {
  try {
    const sheet = getSpreadsheet().getSheetByName(SHEETS.SETTINGS_THEMES);
    if (!sheet || sheet.getLastRow() <= 1) return { success: true, data: [] };
    const data = sheet.getDataRange().getValues();
    const list = [];
    for (let i = 1; i < data.length; i++) {
      if (!data[i][0] || String(data[i][2]).trim().toLowerCase() === 'deleted') continue;
      list.push({ id: String(data[i][0]).trim(), name: String(data[i][1]).trim(), status: String(data[i][2]).trim() });
    }
    return { success: true, data: list };
  } catch (err) {
    return { success: false, message: err.message, data: [] };
  }
}

function getFormateursList() {
  try {
    const sheet = getSpreadsheet().getSheetByName(SHEETS.SETTINGS_FORMATEURS);
    if (!sheet || sheet.getLastRow() <= 1) return { success: true, data: [] };
    const data = sheet.getDataRange().getValues();
    const list = [];
    for (let i = 1; i < data.length; i++) {
      if (!data[i][0] || String(data[i][2]).trim().toLowerCase() === 'deleted') continue;
      list.push({ id: String(data[i][0]).trim(), name: String(data[i][1]).trim(), status: String(data[i][2]).trim() });
    }
    return { success: true, data: list };
  } catch (err) {
    return { success: false, message: err.message, data: [] };
  }
}

function saveTheme(data, userEmail) {
  try {
    const sheet = getSpreadsheet().getSheetByName(SHEETS.SETTINGS_THEMES);
    if (!sheet) return { success: false, message: 'Feuille SETTINGS_THEMES introuvable' };
    const name = String(data.name || '').trim();
    if (!name) return { success: false, message: 'Le nom du thème est obligatoire.' };
    const existing = sheet.getDataRange().getValues();
    for (let i = 1; i < existing.length; i++) {
      if (data.id && existing[i][0] === data.id) continue;
      if (String(existing[i][2]).trim().toLowerCase() === 'deleted') continue;
      if (String(existing[i][1]).trim().toLowerCase() === name.toLowerCase())
        return { success: false, message: 'Ce thème existe déjà.' };
    }
    if (data.id) {
      for (let i = 1; i < existing.length; i++) {
        if (existing[i][0] !== data.id) continue;
        sheet.getRange(i+1, 2, 1, 2).setValues([[name, data.status || 'active']]);
        logAudit('THEME_UPDATED', data.id, userEmail, 'Thème: ' + name);
        return { success: true, message: 'Thème mis à jour.' };
      }
      return { success: false, message: 'Thème introuvable.' };
    } else {
      const id = 'TH-' + Date.now();
      sheet.appendRow([id, name, 'active', new Date()]);
      logAudit('THEME_CREATED', id, userEmail, 'Thème: ' + name);
      return { success: true, id, message: 'Thème créé.' };
    }
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function deleteTheme(id, userEmail) {
  try {
    const sheet = getSpreadsheet().getSheetByName(SHEETS.SETTINGS_THEMES);
    if (!sheet) return { success: false, message: 'Feuille SETTINGS_THEMES introuvable' };
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() !== String(id).trim()) continue;
      sheet.getRange(i+1, 3).setValue('deleted');
      logAudit('THEME_DELETED', id, userEmail, 'Supprimé: ' + data[i][1]);
      return { success: true, message: 'Thème supprimé.' };
    }
    return { success: false, message: 'Thème introuvable.' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function saveFormateur(data, userEmail) {
  try {
    const sheet = getSpreadsheet().getSheetByName(SHEETS.SETTINGS_FORMATEURS);
    if (!sheet) return { success: false, message: 'Feuille SETTINGS_FORMATEURS introuvable' };
    const name = String(data.name || '').trim();
    if (!name) return { success: false, message: 'Le nom du formateur est obligatoire.' };
    const existing = sheet.getDataRange().getValues();
    for (let i = 1; i < existing.length; i++) {
      if (data.id && existing[i][0] === data.id) continue;
      if (String(existing[i][2]).trim().toLowerCase() === 'deleted') continue;
      if (String(existing[i][1]).trim().toLowerCase() === name.toLowerCase())
        return { success: false, message: 'Ce formateur existe déjà.' };
    }
    if (data.id) {
      for (let i = 1; i < existing.length; i++) {
        if (existing[i][0] !== data.id) continue;
        sheet.getRange(i+1, 2, 1, 2).setValues([[name, data.status || 'active']]);
        logAudit('FORMATEUR_UPDATED', data.id, userEmail, 'Formateur: ' + name);
        return { success: true, message: 'Formateur mis à jour.' };
      }
      return { success: false, message: 'Formateur introuvable.' };
    } else {
      const id = 'FM-' + Date.now();
      sheet.appendRow([id, name, 'active', new Date()]);
      logAudit('FORMATEUR_CREATED', id, userEmail, 'Formateur: ' + name);
      return { success: true, id, message: 'Formateur créé.' };
    }
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function deleteFormateur(id, userEmail) {
  try {
    const sheet = getSpreadsheet().getSheetByName(SHEETS.SETTINGS_FORMATEURS);
    if (!sheet) return { success: false, message: 'Feuille SETTINGS_FORMATEURS introuvable' };
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() !== String(id).trim()) continue;
      sheet.getRange(i+1, 3).setValue('deleted');
      logAudit('FORMATEUR_DELETED', id, userEmail, 'Supprimé: ' + data[i][1]);
      return { success: true, message: 'Formateur supprimé.' };
    }
    return { success: false, message: 'Formateur introuvable.' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// ============================================================
// RESPONSIBLES
// ============================================================
function getResponsiblesList() {
  try {
    const sheet = getSpreadsheet().getSheetByName(SHEETS.RESPONSIBLES);
    if (!sheet || sheet.getLastRow() <= 1) return { success:true, data:[] };
    const data   = sheet.getDataRange().getValues();
    const result = [];
    for (let i = 1; i < data.length; i++) {
      const row    = data[i];
      const status = String(row[8] || '').trim().toLowerCase();
      if (!row[0] || status === 'inactive' || status === 'deleted') continue;
      result.push({
        name:     String(row[1] || '').trim(),
        role:     String(row[2] || '').trim(),
        contact:  String(row[3] || '').trim(),
        whatsapp: String(row[4] || '').trim(),
      });
    }
    return { success: true, data: result };
  } catch (err) {
    return { success: false, message: err.message, data: [] };
  }
}

// ============================================================
// UPDATE INCIDENT FROM ADMIN
// ============================================================
function updateIncidentFromAdmin(reportId, responsibleName, status, rootCause, userEmail) {
  try {
    if (!reportId) return { success:false, message:'ID rapport manquant' };
    if ((status === 'Clôturé' || status === 'CLOSED') &&
        (!rootCause || String(rootCause).trim() === '')) {
      return { success: false, message: 'Clôture impossible : la Cause Racine est obligatoire.' };
    }
    const ss      = getSpreadsheet();
    const sheet   = ss.getSheetByName(SHEETS.REPORTS);
    if (!sheet) return { success:false, message:'Feuille REPORTS introuvable' };
    const headers   = getReportHeaders();
    const headerMap = {};
    headers.forEach((h, i) => { headerMap[h] = i + 1; });
    const values = sheet.getDataRange().getValues();
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][0]).trim() !== String(reportId).trim()) continue;
      const rowNum = i + 1;
      if (headerMap['ASSIGNED_TO'] && responsibleName !== undefined)
        sheet.getRange(rowNum, headerMap['ASSIGNED_TO']).setValue(responsibleName || '');
      if (headerMap['STATUS'] && status)
        sheet.getRange(rowNum, headerMap['STATUS']).setValue(status);
      if (headerMap['ROOT_CAUSE'] && rootCause !== undefined)
        sheet.getRange(rowNum, headerMap['ROOT_CAUSE']).setValue(rootCause || '');
      if (status === 'Clôturé' || status === 'CLOSED') {
        if (headerMap['CLOSURE_DATE']) sheet.getRange(rowNum, headerMap['CLOSURE_DATE']).setValue(new Date());
        if (headerMap['CLOSED_BY'])    sheet.getRange(rowNum, headerMap['CLOSED_BY']).setValue(userEmail || 'ADMIN');
      }
      logAudit('INCIDENT_UPDATED_ADMIN', reportId, userEmail || 'ADMIN',
        'Assigné à: ' + (responsibleName || '—') + ' | Statut→' + (status || '—') + ' | Cause: ' + (rootCause || '—'));
      return { success: true, message: 'Incident mis à jour avec succès' };
    }
    return { success: false, message: 'Rapport introuvable: ' + reportId };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// ============================================================
// ZONE PARETO DATA
// ============================================================
function getZoneParetoData() {
  try {
    const ss    = getSpreadsheet();
    const sheet = ss.getSheetByName(SHEETS.REPORTS);
    if (!sheet || sheet.getLastRow() <= 1) return { success:true, data:[] };
    const headers = getReportHeaders();
    const zoneIdx = headers.indexOf('ZONE');
    const idIdx   = headers.indexOf('REPORT_ID');
    if (zoneIdx < 0) return { success:false, message:'Colonne ZONE introuvable' };
    const values  = sheet.getRange(2, 1, sheet.getLastRow()-1, headers.length).getValues();
    const counter = {};
    values.forEach(row => {
      const id   = String(row[idIdx] || '').trim();
      const zone = String(row[zoneIdx] || '').trim();
      if (!id || !zone) return;
      counter[zone] = (counter[zone] || 0) + 1;
    });
    const sorted = Object.entries(counter)
      .map(([zone, count]) => ({ zone, count }))
      .sort((a, b) => b.count - a.count);
    return { success: true, data: sorted };
  } catch (err) {
    return { success: false, message: err.message, data: [] };
  }
}

// ============================================================
// ADMIN STATS DATA
// ============================================================
function getAdminStatsData() {
  try {
    const ss    = getSpreadsheet();
    const sheet = ss.getSheetByName(SHEETS.REPORTS);
    if (!sheet || sheet.getLastRow() <= 1) return { success: true, data: [] };
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).trim());
    const col = name => headers.indexOf(name);
    const idIdx        = col('REPORT_ID');
    const tsIdx        = col('TIMESTAMP');
    const zoneIdx      = col('ZONE');
    const deptIdx      = col('DEPARTMENT');
    const typeIdx      = col('INCIDENT_TYPE');
    const severityIdx  = col('SEVERITY');
    const statusIdx    = col('STATUS');
    const assignedIdx  = col('ASSIGNED_TO');
    const rootCauseIdx = col('ROOT_CAUSE');
    const employeeIdx  = col('EMPLOYEE_NAME');
    const lineIdx      = col('PRODUCTION_LINE');
    const rawData = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
    const result  = [];
    for (let i = 0; i < rawData.length; i++) {
      const row      = rawData[i];
      const reportId = String(row[idIdx] || '').trim();
      if (!reportId) continue;
      let isoDate = '';
      if (tsIdx >= 0) {
        const rawTs = row[tsIdx];
        if (rawTs instanceof Date && !isNaN(rawTs)) isoDate = rawTs.toISOString();
        else if (rawTs) { try { isoDate = new Date(rawTs).toISOString(); } catch(e){ isoDate=''; } }
      }
      result.push({
        id: reportId, date: isoDate, dateShort: isoDate ? isoDate.slice(0,10) : '',
        month:       isoDate ? new Date(isoDate).getMonth() + 1 : null,
        zone:        zoneIdx      >= 0 ? String(row[zoneIdx]      || '').trim() : '',
        department:  deptIdx      >= 0 ? String(row[deptIdx]      || '').trim() : '',
        incidentType:typeIdx      >= 0 ? String(row[typeIdx]      || '').trim() : '',
        severity:    severityIdx  >= 0 ? String(row[severityIdx]  || '').trim() : '',
        status:      statusIdx    >= 0 ? String(row[statusIdx]    || '').trim() : '',
        responsible: assignedIdx  >= 0 ? String(row[assignedIdx]  || '').trim() : '',
        rootCause:   rootCauseIdx >= 0 ? String(row[rootCauseIdx] || '').trim() : '',
        employee:    employeeIdx  >= 0 ? String(row[employeeIdx]  || '').trim() : '',
        line:        lineIdx      >= 0 ? String(row[lineIdx]      || '').trim() : '',
      });
    }
    return { success: true, data: result };
  } catch (err) {
    return { success: false, message: err.message, data: [] };
  }
}

// ============================================================
// PROMOTE TO CAPA
// ============================================================
function promoteToCapaSystem(reportId) {
  try {
    if (!reportId) return { success: false, message: '`reportId` requis' };
    const ss       = getSpreadsheet();
    const repSheet = ss.getSheetByName(SHEETS.REPORTS);
    if (!repSheet) return { success: false, message: 'Feuille REPORTS introuvable' };
    const repHeaders = repSheet.getRange(1, 1, 1, repSheet.getLastColumn()).getValues()[0].map(h => String(h).trim());
    const rc = name => repHeaders.indexOf(name);
    const idIdx   = rc('REPORT_ID');
    const zoneIdx = rc('ZONE');
    const lineIdx = rc('PRODUCTION_LINE');
    const descIdx = rc('DESCRIPTION');
    const rcIdx   = rc('ROOT_CAUSE');
    if (idIdx < 0) return { success: false, message: 'Colonne REPORT_ID introuvable' };
    if (repSheet.getLastRow() < 2) return { success: false, message: 'Aucun incident trouvé' };
    const repData = repSheet.getRange(2, 1, repSheet.getLastRow()-1, repSheet.getLastColumn()).getValues();
    const incRow  = repData.find(row => String(row[idIdx]).trim() === String(reportId).trim());
    if (!incRow) return { success: false, message: 'Incident introuvable: ' + reportId };
    const zone     = zoneIdx >= 0 ? String(incRow[zoneIdx] || '').trim() : '';
    const line     = lineIdx >= 0 ? String(incRow[lineIdx] || '').trim() : '';
    const desc     = descIdx >= 0 ? String(incRow[descIdx] || '').trim() : '';
    const rcVal    = rcIdx   >= 0 ? String(incRow[rcIdx]   || '').trim() : '';
    const zoneLine = [zone, line].filter(Boolean).join(' / ') || '—';
    const descFinal = rcVal ? ('Cause racine: ' + rcVal + (desc ? ' | ' + desc : '')) : (desc || '—');
    const CAPA_COLS = ['CAPA_ID','INCIDENT_ID','DATE_PROMOTION','ZONE_LIGNE','DESCRIPTION','STATUT_CAPA','ACTION_CORRECTIVE','ACTION_PREVENTIVE','COMMENTAIRES'];
    let capaSheet = ss.getSheetByName(SHEETS.CAPA);
    if (!capaSheet) {
      capaSheet = ss.insertSheet(SHEETS.CAPA);
      capaSheet.getRange(1, 1, 1, CAPA_COLS.length).setValues([CAPA_COLS]);
      capaSheet.getRange(1, 1, 1, CAPA_COLS.length).setBackground('#0f2744').setFontColor('#ffffff').setFontWeight('bold');
      capaSheet.setFrozenRows(1);
    }
    if (capaSheet.getLastRow() > 1) {
      const existingIds = capaSheet.getRange(2, 2, capaSheet.getLastRow()-1, 1).getValues();
      if (existingIds.some(r => String(r[0]).trim() === String(reportId).trim()))
        return { success: false, message: 'Cet incident a déjà été promu en CAPA' };
    }
    const now     = new Date();
    const pad     = n => String(n).padStart(2,'0');
    const dateTag = now.getFullYear().toString() + pad(now.getMonth()+1) + pad(now.getDate());
    const seq     = String(Math.max(1, capaSheet.getLastRow())).padStart(3,'0');
    const capaId  = 'CAPA-' + dateTag + '-' + seq;
    capaSheet.appendRow([capaId, reportId, now, zoneLine, descFinal, "En attente de plan d'action", '', '', '']);
    capaSheet.getRange(capaSheet.getLastRow(), 3).setNumberFormat('dd/mm/yyyy hh:mm');
    logAudit('PROMOTE_TO_CAPA', reportId, 'SYSTEM', 'Promu vers CAPA: ' + capaId);
    return { success: true, capaId, message: 'Incident promu avec succès' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// ============================================================
// DECLARATION STATS
// ============================================================
function getDeclarationStats() {
  try {
    const ss    = getSpreadsheet();
    const sheet = ss.getSheetByName(SHEETS.REPORTS);
    if (!sheet || sheet.getLastRow() <= 1) return { success:true, total:0, resolved:0 };
    const lastRow  = sheet.getLastRow();
    const idValues = sheet.getRange(2, 1, lastRow-1, 1).getValues();
    let total = 0;
    idValues.forEach(r => { if (String(r[0]||'').trim() !== '') total++; });
    const statusColIndex = getReportHeaders().indexOf('STATUS');
    let resolved = 0;
    if (statusColIndex >= 0 && total > 0) {
      const sv = sheet.getRange(2, statusColIndex+1, lastRow-1, 1).getValues();
      sv.forEach(r => { const s = String(r[0]||'').trim(); if (s && CONFIG.RESOLVED_STATUSES.indexOf(s) !== -1) resolved++; });
    }
    return { success:true, total, resolved };
  } catch (err) {
    return { success:false, message:err.message, total:0, resolved:0 };
  }
}

// ============================================================
// EMPLOYEE BADGE LOOKUP
// ============================================================
function findEmployeeByBadge(badgeNumber) {
  try {
    if (!badgeNumber || String(badgeNumber).trim() === '')
      return { success:false, message:'Numéro de badge manquant' };
    const ss    = getSpreadsheet();
    const sheet = ss.getSheetByName(SHEETS.EMPLOYEES);
    if (!sheet || sheet.getLastRow() <= 1) return { success:false, message:'Aucun employé trouvé' };
    const query = String(badgeNumber).trim().replace(/\.0+$/,'').replace(/^0+([0-9]+)$/,'$1');
    const data  = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const rowBadge = String(data[i][0]||'').trim().replace(/\.0+$/,'').replace(/^0+([0-9]+)$/,'$1');
      if (rowBadge !== query) continue;
      const fullName   = String(data[i][1]||'').trim();
      const department = String(data[i][2]||'').trim();
      if (!fullName) continue;
      return { success:true, name:fullName, department };
    }
    return { success:false, message:'Badge introuvable: '+query };
  } catch (err) {
    return { success:false, message:'Erreur serveur: '+err.message };
  }
}

// ============================================================
// REPORT CRUD
// ============================================================
function submitReport(formData)              { return _writeReport(formData, null, 'SYSTEM'); }
function createReportManual(formData, actor) { return _writeReport(formData, null, actor); }

function _writeReport(formData, existingId, actor) {
  try {
    const ss    = getSpreadsheet();
    const sheet = ss.getSheetByName(SHEETS.REPORTS);
    if (!sheet) return { success:false, message:'Feuille REPORTS introuvable' };
    const rawName      = String(formData.employeeName||'').trim();
    const anonFlag     = formData.isAnonymous === true || formData.isAnonymous === 'true';
    const employeeName = (anonFlag||!rawName) ? CONFIG.ANONYMOUS_LABEL : rawName;
    const reportId     = existingId || generateReportId();
    const timestamp    = new Date();
    let photoUrl = '';
    if (formData.photoData && formData.photoData.length > 100) {
      try { photoUrl = uploadPhotoToDrive(formData.photoData, reportId, formData.department); }
      catch(pe) { Logger.log('Photo upload ignorée: '+pe); }
    }
    const row = [
      reportId, timestamp, employeeName,
      formData.department||'', formData.zone||'', formData.productionLine||'',
      formData.incidentType||'', formData.severity||'', formData.description||'',
      formData.immediateAction||'', photoUrl, 'OPEN', '','','','','','','','','',
      formData.language||'FR', '', Utilities.getUuid(),
    ];
    sheet.appendRow(row);
    try { applyRowFormatting(sheet, sheet.getLastRow(), formData.severity); } catch(e){}
    try { logAudit('REPORT_CREATED', reportId, actor, (formData.severity||'')+'—'+employeeName); } catch(e){}
    return { success:true, reportId, message:'Rapport soumis avec succès', timestamp:timestamp.toISOString() };
  } catch(err) {
    return { success:false, message:err.message };
  }
}

function getReports(filters) {
  try {
    const ss    = getSpreadsheet();
    const sheet = ss.getSheetByName(SHEETS.REPORTS);
    if (!sheet) return { success:false, message:'Feuille REPORTS introuvable' };
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return { success:true, data:[] };
    const headers = getReportHeaders();
    const values  = sheet.getRange(2, 1, lastRow-1, headers.length).getValues();
    let reports = values.map((row,i) => {
      const r = {};
      headers.forEach((h,j) => { r[h] = row[j]; });
      r._row = i+2;
      const rawTs = row[1];
      if (rawTs instanceof Date && !isNaN(rawTs)) r.timestamp = rawTs.toISOString();
      else if (rawTs) { try { r.timestamp = new Date(rawTs).toISOString(); } catch(e){ r.timestamp=''; } }
      else r.timestamp = '';
      return r;
    }).filter(r => String(r['REPORT_ID']||'').trim() !== '');
    if (filters) {
      if (filters.status)     reports = reports.filter(r => r['STATUS']     === filters.status);
      if (filters.severity)   reports = reports.filter(r => r['SEVERITY']   === filters.severity);
      if (filters.department) reports = reports.filter(r => r['DEPARTMENT'] === filters.department);
      if (filters.zone)       reports = reports.filter(r => r['ZONE']       === filters.zone);
      if (filters.dateFrom)   reports = reports.filter(r => r.timestamp && new Date(r.timestamp) >= new Date(filters.dateFrom));
      if (filters.dateTo)     reports = reports.filter(r => r.timestamp && new Date(r.timestamp) <= new Date(filters.dateTo));
      if (filters.search) {
        const q = filters.search.toLowerCase();
        reports = reports.filter(r =>
          (r['REPORT_ID']||'').toLowerCase().includes(q)||
          (r['DESCRIPTION']||'').toLowerCase().includes(q)||
          (r['EMPLOYEE_NAME']||'').toLowerCase().includes(q)||
          (r['INCIDENT_TYPE']||'').toLowerCase().includes(q));
      }
    }
    reports.sort((a,b)=>(!a.timestamp?1:!b.timestamp?-1:new Date(b.timestamp)-new Date(a.timestamp)));
    return { success:true, data:reports };
  } catch(err) {
    return { success:false, message:err.message };
  }
}

function getReportById(reportId) {
  try {
    const ss    = getSpreadsheet();
    const sheet = ss.getSheetByName(SHEETS.REPORTS);
    if (!sheet) return { success:false, message:'Feuille REPORTS introuvable' };
    const headers = getReportHeaders();
    const values  = sheet.getDataRange().getValues();
    for (let i=1; i<values.length; i++) {
      if (String(values[i][0]).trim() !== String(reportId).trim()) continue;
      const r = {};
      headers.forEach((h,j) => { r[h] = values[i][j]; });
      r._row = i+1;
      const rawTs = values[i][1];
      if (rawTs instanceof Date && !isNaN(rawTs)) r.timestamp = rawTs.toISOString();
      else if (rawTs) { try { r.timestamp = new Date(rawTs).toISOString(); } catch(e){ r.timestamp=''; } }
      else r.timestamp = '';
      return { success:true, data:r };
    }
    return { success:false, message:'Rapport introuvable: '+reportId };
  } catch(err) { return { success:false, message:err.message }; }
}

function updateReport(reportId, updates, userEmail) {
  try {
    const ss    = getSpreadsheet();
    const sheet = ss.getSheetByName(SHEETS.REPORTS);
    if (!sheet) return { success:false, message:'Feuille REPORTS introuvable' };
    const headers   = getReportHeaders();
    const headerMap = {};
    headers.forEach((h,i) => { headerMap[h]=i+1; });
    const values = sheet.getDataRange().getValues();
    for (let i=1; i<values.length; i++) {
      if (String(values[i][0]).trim() !== String(reportId).trim()) continue;
      const rowNum = i+1;
      Object.keys(updates).forEach(key => {
        if (headerMap[key] !== undefined) sheet.getRange(rowNum, headerMap[key]).setValue(updates[key]);
      });
      if (updates.STATUS === 'CLOSED') {
        if (!values[i][18]) sheet.getRange(rowNum,19).setValue(new Date());
        sheet.getRange(rowNum,20).setValue(userEmail||'SYSTEM');
      }
      logAudit('REPORT_UPDATED', reportId, userEmail||'SYSTEM', 'Status→'+(updates.STATUS||values[i][11]));
      return { success:true, message:'Rapport mis à jour' };
    }
    return { success:false, message:'Rapport introuvable: '+reportId };
  } catch(err) {
    return { success:false, message:err.message };
  }
}

function deleteReport(reportId, userEmail) {
  try {
    const ss      = getSpreadsheet();
    const sheet   = ss.getSheetByName(SHEETS.REPORTS);
    const archive = ss.getSheetByName(SHEETS.ARCHIVE);
    if (!sheet) return { success:false, message:'Feuille REPORTS introuvable' };
    const values = sheet.getDataRange().getValues();
    for (let i=1; i<values.length; i++) {
      if (String(values[i][0]).trim() !== String(reportId).trim()) continue;
      if (archive) archive.appendRow([...values[i],'DELETED',userEmail,new Date()]);
      sheet.deleteRow(i+1);
      logAudit('REPORT_DELETED', reportId, userEmail||'SYSTEM', 'Archived');
      return { success:true, message:'Rapport supprimé et archivé' };
    }
    return { success:false, message:'Rapport introuvable: '+reportId };
  } catch(err) {
    return { success:false, message:err.message };
  }
}

// ============================================================
// KPIs
// ============================================================
function getDashboardKPIs() {
  try {
    const result  = getReports(null);
    if (!result.success) return result;
    const reports = result.data;
    const now     = new Date();
    const mm = now.getMonth(), yy = now.getFullYear();
    return {
      success:true, data:{
        total:              reports.length,
        open:               reports.filter(r=>r['STATUS']==='OPEN').length,
        critical:           reports.filter(r=>r['SEVERITY']==='Critical').length,
        closed:             reports.filter(r=>r['STATUS']==='CLOSED').length,
        underInvestigation: reports.filter(r=>r['STATUS']==='UNDER INVESTIGATION').length,
        actionInProgress:   reports.filter(r=>r['STATUS']==='ACTION IN PROGRESS').length,
        verified:           reports.filter(r=>r['STATUS']==='VERIFIED').length,
        thisMonth:          reports.filter(r=>{ if(!r.timestamp)return false; const d=new Date(r.timestamp); return d.getMonth()===mm&&d.getFullYear()===yy; }).length,
        avgClosureTime:     calculateAvgClosureTime(reports),
        byZone:             groupBy(reports,'ZONE'),
        byType:             groupBy(reports,'INCIDENT_TYPE'),
        bySeverity:         groupBy(reports,'SEVERITY'),
        byDepartment:       groupBy(reports,'DEPARTMENT'),
        byStatus:           groupBy(reports,'STATUS'),
        monthlyTrend:       getMonthlyTrend(reports),
        recentReports:      reports.slice(0,10),
        overdueCapas:       getOverdueCapas(reports),
      }
    };
  } catch(err) {
    return { success:false, message:err.message };
  }
}

function calculateAvgClosureTime(reports) {
  const closed = reports.filter(r=>r['STATUS']==='CLOSED'&&r.timestamp&&r['CLOSURE_DATE']&&String(r['CLOSURE_DATE']).trim()!=='');
  if (!closed.length) return 0;
  const total = closed.reduce((s,r)=>{
    const o=new Date(r.timestamp), c=r['CLOSURE_DATE'] instanceof Date?r['CLOSURE_DATE']:new Date(r['CLOSURE_DATE']);
    return s+Math.max(0,(c-o)/86400000);
  },0);
  return Math.round(total/closed.length);
}

function getMonthlyTrend(reports) {
  const now = new Date();
  return Array.from({length:6},(_,i)=>{
    const d = new Date(now.getFullYear(), now.getMonth()-(5-i), 1);
    return { label:d.toLocaleString('fr-FR',{month:'short',year:'2-digit'}), count:reports.filter(r=>{ if(!r.timestamp)return false; const rd=new Date(r.timestamp); return rd.getMonth()===d.getMonth()&&rd.getFullYear()===d.getFullYear(); }).length };
  });
}

function getOverdueCapas(reports) {
  const now = new Date();
  return reports.filter(r=>{ if(r['STATUS']==='CLOSED'||r['STATUS']==='VERIFIED'||!r.timestamp)return false; return (now-new Date(r.timestamp))/86400000>7; }).length;
}

function groupBy(arr, key) {
  return arr.reduce((acc,item)=>{ const val=String(item[key]||'Unknown').trim()||'Unknown'; acc[val]=(acc[val]||0)+1; return acc; },{});
}

// ============================================================
// AUTHENTICATION
// ============================================================
function authenticateUser(username, password) {
  try {
    const ss    = getSpreadsheet();
    const sheet = ss.getSheetByName(SHEETS.USERS);
    if (!sheet) { initializeSystem(); return { success:false, message:'Système initialisé — réessayez.' }; }
    const data = sheet.getDataRange().getValues();
    for (let i=1; i<data.length; i++) {
      if (String(data[i][1]).trim()!==String(username).trim()) continue;
      if (data[i][3]!=='active') continue;
      if (data[i][2]!==hashPassword(password)) continue;
      const token = createSession(data[i][0], data[i][1], data[i][4]);
      logAudit('LOGIN', data[i][1], data[i][1], 'Connexion réussie');
      return { success:true, token, user:{ id:data[i][0], username:data[i][1], role:data[i][4], name:data[i][5]||data[i][1], email:data[i][6]||'' } };
    }
    logAudit('LOGIN_FAILED', username, username, 'Mauvais identifiants');
    return { success:false, message:'Identifiants invalides.' };
  } catch(err) { return { success:false, message:err.message }; }
}

function createSession(userId, username, role) {
  const token  = Utilities.getUuid();
  const expiry = new Date(Date.now()+CONFIG.SESSION_DURATION_HOURS*3600000);
  CacheService.getScriptCache().put('session_'+token, JSON.stringify({userId,username,role,expiry:expiry.toISOString()}), CONFIG.SESSION_DURATION_HOURS*3600);
  return token;
}

function logout(token) {
  try { CacheService.getScriptCache().remove('session_'+token); } catch(e) {}
  return { success:true };
}

// ============================================================
// USERS
// ============================================================
function createUser(userData, createdBy) {
  try {
    const sheet = getSpreadsheet().getSheetByName(SHEETS.USERS);
    if (!sheet) return { success: false, message: 'Feuille USERS introuvable' };
    const username = String(userData.username || '').trim();
    const password = String(userData.password || '').trim();
    const fullName = String(userData.fullName || '').trim();
    const email    = String(userData.email    || '').trim();
    const role     = String(userData.role     || '').trim();
    if (!username || !password || !fullName || !email || !role)
      return { success: false, message: 'Tous les champs obligatoires sont requis.' };
    if (password.length < 6)
      return { success: false, message: 'Mot de passe trop court (min. 6 caractères).' };
    const existing = sheet.getDataRange().getValues();
    for (let i = 1; i < existing.length; i++) {
      if (String(existing[i][1]).trim().toLowerCase() === username.toLowerCase())
        return { success: false, message: 'Cet identifiant existe déjà: ' + username };
    }
    const id = 'USR-' + Date.now();
    sheet.appendRow([id, username, hashPassword(password), userData.status||'active', role, fullName, email, userData.department||'', '', new Date()]);
    logAudit('USER_CREATED', id, createdBy, 'Créé: ' + username + ' (' + role + ')');
    return { success: true, id, message: 'Utilisateur créé: ' + username };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function getUsers() {
  try {
    const sheet = getSpreadsheet().getSheetByName(SHEETS.USERS);
    if (!sheet) return { success:false, message:'Feuille USERS introuvable' };
    const data  = sheet.getDataRange().getValues();
    const users = [];
    for (let i=1; i<data.length; i++) {
      if (!data[i][0]) continue;
      users.push({ id:data[i][0], username:data[i][1], status:data[i][3], role:data[i][4], name:data[i][5], email:data[i][6], department:data[i][7] });
    }
    return { success:true, data:users };
  } catch(err) { return { success:false, message:err.message }; }
}

// ============================================================
// RESPONSIBLES CRUD
// ============================================================
function getResponsibles() {
  try {
    const sheet = getSpreadsheet().getSheetByName(SHEETS.RESPONSIBLES);
    if (!sheet) return { success:true, data:[] };
    const data  = sheet.getDataRange().getValues();
    const list  = [];
    for (let i=1; i<data.length; i++) {
      if (!data[i][0]) continue;
      list.push({ id:data[i][0], fullName:data[i][1], department:data[i][2], email:data[i][3], whatsapp:data[i][4], zone:data[i][5], incidentType:data[i][6], priority:data[i][7], status:data[i][8], createdDate:data[i][9] instanceof Date?data[i][9].toISOString():data[i][9] });
    }
    return { success:true, data:list };
  } catch(err) { return { success:false, message:err.message }; }
}

function saveResponsible(data, userEmail) {
  try {
    const sheet = getSpreadsheet().getSheetByName(SHEETS.RESPONSIBLES);
    if (!sheet) return { success:false, message:'Feuille RESPONSIBLES introuvable' };
    const existing = sheet.getDataRange().getValues();
    for (let i=1; i<existing.length; i++) {
      if (data.id && existing[i][0]===data.id) continue;
      if (String(existing[i][1]).trim().toLowerCase()===String(data.fullName||'').trim().toLowerCase())
        return { success:false, message:'Un responsable avec ce nom existe déjà.' };
    }
    if (data.id) {
      for (let i=1; i<existing.length; i++) {
        if (existing[i][0]!==data.id) continue;
        sheet.getRange(i+1,2,1,8).setValues([[data.fullName,data.department,data.email,data.whatsapp,data.zone,data.incidentType,data.priority||'Medium',data.status||'active']]);
        logAudit('RESPONSIBLE_UPDATED', data.id, userEmail, 'Mis à jour: '+data.fullName);
        return { success:true, message:'Responsable mis à jour' };
      }
      return { success:false, message:'Responsable introuvable' };
    } else {
      const id = 'RSP-'+Date.now();
      sheet.appendRow([id,data.fullName,data.department,data.email,data.whatsapp,data.zone||'',data.incidentType||'',data.priority||'Medium','active',new Date()]);
      logAudit('RESPONSIBLE_CREATED', id, userEmail, 'Créé: '+data.fullName);
      return { success:true, id, message:'Responsable créé' };
    }
  } catch(err) { return { success:false, message:err.message }; }
}

function deleteResponsible(id, userEmail) {
  try {
    const sheet = getSpreadsheet().getSheetByName(SHEETS.RESPONSIBLES);
    if (!sheet) return { success:false, message:'Feuille RESPONSIBLES introuvable' };
    const data = sheet.getDataRange().getValues();
    for (let i=1; i<data.length; i++) {
      if (data[i][0]!==id) continue;
      logAudit('RESPONSIBLE_DELETED', id, userEmail, 'Supprimé: '+data[i][1]);
      sheet.deleteRow(i+1);
      return { success:true, message:'Responsable supprimé' };
    }
    return { success:false, message:'Responsable introuvable' };
  } catch(err) { return { success:false, message:err.message }; }
}

// ============================================================
// DYNAMIC SETTINGS
// ============================================================
function getSettingsList(type) {
  const sheetName = _resolveSettingSheet(type);
  if (!sheetName) return { success:false, message:'Type inconnu: '+type };
  try {
    const sheet = getSpreadsheet().getSheetByName(sheetName);
    if (!sheet) return { success:true, data:[] };
    const data = sheet.getDataRange().getValues();
    const list = [];
    for (let i=1; i<data.length; i++) {
      if (!data[i][0]||data[i][2]==='deleted') continue;
      list.push({ id:data[i][0], name:data[i][1], status:data[i][2] });
    }
    return { success:true, data:list };
  } catch(err) { return { success:false, message:err.message }; }
}

function getAllDynamicSettings() {
  return { success:true, zones:getSettingsList('zones').data||[], types:getSettingsList('types').data||[], departments:getSettingsList('departments').data||[], locations:getSettingsList('locations').data||[] };
}

function saveSettingItem(type, data, userEmail) {
  const sheetName = _resolveSettingSheet(type);
  if (!sheetName) return { success:false, message:'Type inconnu' };
  try {
    const sheet    = getSpreadsheet().getSheetByName(sheetName);
    if (!sheet)    return { success:false, message:'Feuille introuvable: '+sheetName };
    const existing = sheet.getDataRange().getValues();
    for (let i=1; i<existing.length; i++) {
      if (data.id&&existing[i][0]===data.id) continue;
      if (existing[i][2]==='deleted') continue;
      if (String(existing[i][1]).trim().toLowerCase()===String(data.name||'').trim().toLowerCase())
        return { success:false, message:'Cette valeur existe déjà.' };
    }
    if (data.id) {
      for (let i=1; i<existing.length; i++) {
        if (existing[i][0]!==data.id) continue;
        sheet.getRange(i+1,2,1,2).setValues([[data.name,data.status||'active']]);
        logAudit('SETTING_UPDATED', type+':'+data.id, userEmail, 'Mis à jour: '+data.name);
        return { success:true, message:'Mis à jour' };
      }
      return { success:false, message:'Item introuvable' };
    } else {
      const prefix = {zones:'ZN',types:'TY',departments:'DP',locations:'LC'}[type]||'IT';
      const id = prefix+'-'+Date.now();
      sheet.appendRow([id,data.name,'active',new Date()]);
      logAudit('SETTING_CREATED', type+':'+id, userEmail, 'Créé: '+data.name);
      return { success:true, id, message:'Créé avec succès' };
    }
  } catch(err) { return { success:false, message:err.message }; }
}

function deleteSettingItem(type, id, userEmail) {
  const sheetName = _resolveSettingSheet(type);
  if (!sheetName) return { success:false, message:'Type inconnu' };
  try {
    const sheet = getSpreadsheet().getSheetByName(sheetName);
    if (!sheet)  return { success:false, message:'Feuille introuvable' };
    const data  = sheet.getDataRange().getValues();
    for (let i=1; i<data.length; i++) {
      if (data[i][0]!==id) continue;
      sheet.getRange(i+1,3).setValue('deleted');
      logAudit('SETTING_DELETED', type+':'+id, userEmail, 'Supprimé: '+data[i][1]);
      return { success:true, message:'Supprimé' };
    }
    return { success:false, message:'Item introuvable' };
  } catch(err) { return { success:false, message:err.message }; }
}

function _resolveSettingSheet(type) {
  return { zones:SHEETS.SETTINGS_ZONES, types:SHEETS.SETTINGS_TYPES, departments:SHEETS.SETTINGS_DEPARTMENTS, locations:SHEETS.SETTINGS_LOCATIONS }[type] || null;
}

// ============================================================
// KEY-VALUE SETTINGS
// ============================================================
function getSettings() {
  try {
    const sheet = getSpreadsheet().getSheetByName(SHEETS.SETTINGS);
    if (!sheet) return { success:true, data:{} };
    const data = sheet.getDataRange().getValues();
    const out  = {};
    for (let i=1; i<data.length; i++) { if (data[i][0]) out[data[i][0]]=data[i][1]; }
    return { success:true, data:out };
  } catch(err) { return { success:false, message:err.message }; }
}

function saveSetting(key, value) {
  try {
    const sheet = getSpreadsheet().getSheetByName(SHEETS.SETTINGS);
    if (!sheet) return { success:false, message:'Feuille SETTINGS introuvable' };
    const data  = sheet.getDataRange().getValues();
    for (let i=1; i<data.length; i++) {
      if (data[i][0]===key) { sheet.getRange(i+1,2).setValue(value); sheet.getRange(i+1,4).setValue(new Date()); return { success:true }; }
    }
    sheet.appendRow([key,value,'',new Date()]);
    return { success:true };
  } catch(err) { return { success:false, message:err.message }; }
}

// ============================================================
// CAPA
// ============================================================
function createCAPA(capaData, userEmail) {
  try {
    const sheet = getSpreadsheet().getSheetByName(SHEETS.CAPA);
    if (!sheet) return { success:false, message:'Feuille CAPA introuvable' };
    const capaId = 'CAPA-'+Date.now();
    sheet.appendRow([capaId,capaData.reportId,new Date(),capaData.rootCause,capaData.correctiveAction,capaData.preventiveAction,capaData.responsiblePerson,capaData.dueDate,'OPEN','','',capaData.priority||'Medium',userEmail]);
    updateReport(capaData.reportId,{STATUS:'ACTION IN PROGRESS',CAPA_ID:capaId},userEmail);
    return { success:true, capaId };
  } catch(err) { return { success:false, message:err.message }; }
}

function getCAPAs(reportId) {
  try {
    const sheet = getSpreadsheet().getSheetByName(SHEETS.CAPA);
    if (!sheet) return { success:true, data:[] };
    const data  = sheet.getDataRange().getValues();
    const capas = [];
    for (let i=1; i<data.length; i++) {
      if (!data[i][0]) continue;
      if (reportId&&data[i][1]!==reportId) continue;
      capas.push({ id:data[i][0], reportId:data[i][1], createdDate:data[i][2] instanceof Date?data[i][2].toISOString():data[i][2], rootCause:data[i][3], correctiveAction:data[i][4], preventiveAction:data[i][5], responsible:data[i][6], dueDate:data[i][7] instanceof Date?data[i][7].toISOString():data[i][7], status:data[i][8], priority:data[i][11] });
    }
    return { success:true, data:capas };
  } catch(err) { return { success:false, message:err.message }; }
}

// ============================================================
// AUDIT
// ============================================================
function logAudit(action, entityId, userId, details) {
  try {
    const sheet = getSpreadsheet().getSheetByName(SHEETS.AUDIT_LOGS);
    if (sheet) sheet.appendRow([new Date(),action,entityId,userId,details,Session.getActiveUserEmail()||'SYSTEM']);
  } catch(e) { Logger.log('logAudit error: '+e); }
}

// ============================================================
// EXPORT CSV
// ============================================================
function exportReportsCSV() {
  const result = getReports(null);
  if (!result.success) return result;
  const headers = getReportHeaders();
  const rows    = [headers.map(h=>'"'+h+'"').join(',')];
  result.data.forEach(r => {
    rows.push(headers.map(h=>'"'+String(r[h]===null||r[h]===undefined?'':r[h]).replace(/"/g,'""').replace(/\n/g,' ')+'"').join(','));
  });
  return { success:true, csv:rows.join('\n'), filename:'FSMS_Export_'+Date.now()+'.csv' };
}

// ============================================================
// GOOGLE DRIVE
// ============================================================
function uploadPhotoToDrive(base64Data, reportId, department) {
  const base64      = base64Data.includes(',')?base64Data.split(',')[1]:base64Data;
  const contentType = base64Data.startsWith('data:image/png')?'image/png':'image/jpeg';
  const blob        = Utilities.newBlob(Utilities.base64Decode(base64), contentType, reportId+'.jpg');
  const root        = getDriveFolder();
  const now         = new Date();
  const yearF       = getOrCreateFolder(root, now.getFullYear().toString());
  const monthF      = getOrCreateFolder(yearF, now.toLocaleString('en',{month:'long'}));
  const deptF       = getOrCreateFolder(monthF, department||'Unknown');
  const file        = deptF.createFile(blob);
  file.setName(reportId+'_'+Date.now()+'.jpg');
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}

function _uploadSensibilisationAttachment(att, theme, dateObj, idx) {
  const raw         = att.base64 || '';
  const base64Clean = raw.includes(',') ? raw.split(',')[1] : raw;
  const isPdf       = att.type === 'pdf' || (att.name || '').toLowerCase().endsWith('.pdf');
  const contentType = isPdf
    ? 'application/pdf'
    : (raw.startsWith('data:image/png') ? 'image/png' : 'image/jpeg');
  const ext         = isPdf ? 'pdf' : (contentType === 'image/png' ? 'png' : 'jpg');
  const pad         = n => String(n).padStart(2, '0');
  const dateTag     = dateObj.getFullYear().toString() + pad(dateObj.getMonth()+1) + pad(dateObj.getDate());
  const safeTheme   = theme.replace(/[^a-zA-Z0-9_\-À-ÿ ]/g,'').replace(/\s+/g,'_').slice(0,40);
  const suffix      = idx > 0 ? '_' + (idx + 1) : '';
  const fileName    = 'SENSIB_' + safeTheme + '_' + dateTag + suffix + '.' + ext;
  const blob        = Utilities.newBlob(Utilities.base64Decode(base64Clean), contentType, fileName);
  const root        = getDriveFolder();
  const sensibF     = getOrCreateFolder(root, 'Sensibilisation_Evidence');
  const yearF       = getOrCreateFolder(sensibF, dateObj.getFullYear().toString());
  const file        = yearF.createFile(blob);
  file.setName(fileName);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}

function uploadQuizQuestionImage(base64Data, questionId) {
  try {
    if (!base64Data || base64Data.length < 100)
      return { success: false, message: 'Données image manquantes.' };
    const base64      = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    const contentType = base64Data.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
    const ext         = contentType === 'image/png' ? 'png' : 'jpg';
    const safeId      = String(questionId || 'NEW').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
    const fileName    = 'QUIZ_IMG_' + safeId + '_' + Date.now() + '.' + ext;
    const blob        = Utilities.newBlob(Utilities.base64Decode(base64), contentType, fileName);
    const root   = getDriveFolder();
    const quizF  = getOrCreateFolder(root, 'Quiz_Questions_Images');
    const file   = quizF.createFile(blob);
    file.setName(fileName);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const fileId = file.getId();
    const imgUrl = 'https://lh3.googleusercontent.com/d/' + fileId;
    logAudit('QUIZ_IMG_UPLOADED', questionId || 'NEW', 'ADMIN', 'Fichier: ' + fileName);
    return { success: true, imageUrl: imgUrl, driveUrl: file.getUrl(), fileId };
  } catch (err) {
    Logger.log('uploadQuizQuestionImage error: ' + err);
    return { success: false, message: err.message };
  }
}

function getDriveFolder() {
  if (CONFIG.DRIVE_FOLDER_ID) { try { return DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID); } catch(e){} }
  const existing = DriveApp.getFoldersByName(CONFIG.APP_TITLE+'_Evidence');
  return existing.hasNext()?existing.next():DriveApp.createFolder(CONFIG.APP_TITLE+'_Evidence');
}

function getOrCreateFolder(parent, name) {
  const existing = parent.getFoldersByName(name);
  return existing.hasNext()?existing.next():parent.createFolder(name);
}

function initializeDriveFolders() {
  const root = getDriveFolder();
  ['Reports','CAPA_Evidence','Audits','Sensibilisation_Evidence','Quiz_Questions_Images'].forEach(n=>getOrCreateFolder(root,n));
}

// ============================================================
// UTILITIES
// ============================================================
function getSpreadsheet() {
  return CONFIG.SPREADSHEET_ID?SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID):SpreadsheetApp.getActiveSpreadsheet();
}

function generateReportId() {
  const now = new Date();
  return CONFIG.REPORT_ID_PREFIX+'-'+now.getFullYear().toString().slice(-2)+String(now.getMonth()+1).padStart(2,'0')+String(now.getDate()).padStart(2,'0')+'-'+String(getNextSequence()).padStart(4,'0');
}

function getNextSequence() {
  const key  = 'report_seq_'+new Date().toDateString();
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(6000);
    const cache = CacheService.getScriptCache();
    const seq   = parseInt(cache.get(key)||'0')+1;
    cache.put(key,String(seq),86400);
    return seq;
  } catch(e){ return Math.floor(Math.random()*9000)+1000; }
  finally { try { lock.releaseLock(); } catch(e){} }
}

function hashPassword(password) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password)
    .map(b=>('0'+(b&0xFF).toString(16)).slice(-2)).join('');
}

function createDefaultAdmin(sheet) {
  sheet.appendRow(['USR-001','admin',hashPassword('Admin@2024!'),'active','Admin','System Administrator','admin@company.com','Management','',new Date()]);
}

function applyRowFormatting(sheet, row, severity) {
  const colors = {Low:'#dcfce7',Medium:'#fef9c3',High:'#ffedd5',Critical:'#fee2e2'};
  sheet.getRange(row,1,1,getReportHeaders().length).setBackground(colors[severity]||'#ffffff');
}

// ============================================================
// SENSIBILISATION DASHBOARD DATA
// ============================================================
function getSensibilisationData() {
  try {
    const ss    = getSpreadsheet();
    const sheet = ss.getSheetByName(SHEETS.EMPLOYEES);
    if (!sheet || sheet.getLastRow() <= 1)
      return { success: true, themes: [], sessions: [], participants: 0, byTheme: [] };
    const data    = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h).trim());
    const BASE_COLS    = 3;
    const themeHeaders = headers.slice(BASE_COLS).filter(h =>
  h && !h.startsWith('QUIZ:') && !h.startsWith('HYGIENE:')
);
    if (!themeHeaders.length)
      return { success: true, themes: [], sessions: [], participants: 0, byTheme: [] };
    const byTheme = [];
    let totalParticipants = 0;
    themeHeaders.forEach((theme, tIdx) => {
      const colIdx = BASE_COLS + tIdx;
      const entries = [];
      for (let r = 1; r < data.length; r++) {
        const cellVal = String(data[r][colIdx] || '').trim();
        if (!cellVal) continue;
        const badge      = String(data[r][0] || '').trim();
        const fullName   = String(data[r][1] || '').trim();
        const department = String(data[r][2] || '').trim();
        let date = '—', animateur = '—';
        const match = cellVal.match(/Sensibilisé le\s+(\d{2}\/\d{2}\/\d{2})\s+par\s+(.+)/i);
        if (match) { date = match[1]; animateur = match[2].trim(); }
        entries.push({ badge, fullName, department, date, animateur, raw: cellVal });
        totalParticipants++;
      }
      const formateurs = {};
      entries.forEach(e => { formateurs[e.animateur] = (formateurs[e.animateur] || 0) + 1; });
      byTheme.push({ theme, count: entries.length, formateurs: Object.entries(formateurs).map(([name, count]) => ({ name, count })), entries });
    });
    const sessions = new Set();
    byTheme.forEach(t => { t.entries.forEach(e => sessions.add(t.theme + '|' + e.animateur + '|' + e.date)); });
    return { success: true, themes: themeHeaders, sessions: sessions.size, participants: totalParticipants, byTheme };
  } catch (err) {
    return { success: false, message: err.message, themes: [], sessions: [], participants: 0, byTheme: [] };
  }
}

function getSensibilisationStats() {
  try {
    const ss    = getSpreadsheet();
    const sheet = ss.getSheetByName(SHEETS.EMPLOYEES);
    if (!sheet || sheet.getLastRow() <= 1) {
      return { success: true, totalUniqueEmployeesTrained: 0, totalSessionsRecorded: 0,
               totalParticipations: 0, totalQuizzes: 0, sessionBreakdown: [] };
    }
    const data    = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h).trim());
    const BASE_COLS = 3;

    // ── Only count pure sensibilisation columns (exclude QUIZ: and HYGIENE:) ──
    const themeHeaders = headers.slice(BASE_COLS).filter(h =>
      h && !h.startsWith('QUIZ:') && !h.startsWith('HYGIENE:')
    );
    const totalSessionsRecorded = themeHeaders.length;

    let uniqueEmployeesTrained = 0;
    let totalParticipations    = 0;
    const themeCountMap = {};
    themeHeaders.forEach(t => { themeCountMap[t] = 0; });

    for (let r = 1; r < data.length; r++) {
      const row = data[r];
      if (!String(row[0] || '').trim()) continue;
      let employeeHasAny = false;
      themeHeaders.forEach((theme, idx) => {
        const colIdx  = BASE_COLS + headers.slice(BASE_COLS).indexOf(theme);
        const cellVal = String(row[colIdx] || '').trim();
        if (cellVal && cellVal.toLowerCase().startsWith('sensibil')) {
          totalParticipations++;
          themeCountMap[theme] = (themeCountMap[theme] || 0) + 1;
          employeeHasAny = true;
        }
      });
      if (employeeHasAny) uniqueEmployeesTrained++;
    }

    // ── SENSIBILISATION_MANUAL: only rows with a sensibilisation theme ──
    const manSheet = ss.getSheetByName(SHEETS.SENSIBILISATION_MANUAL);
    if (manSheet && manSheet.getLastRow() > 1) {
      const manData   = manSheet.getDataRange().getValues();
      const manBadges = new Set();
      for (let i = 1; i < manData.length; i++) {
        const theme   = String(manData[i][1] || '').trim();
        const badge   = String(manData[i][3] || '').trim();
        const cellVal = String(manData[i][6] || '').trim(); // CELL_VALUE column
        if (!theme) continue;
        // Skip if the cell value looks like a quiz or hygiene entry
        if (theme.startsWith('QUIZ:') || theme.startsWith('HYGIENE:')) continue;
        if (cellVal && !cellVal.toLowerCase().startsWith('sensibil')) continue;
        totalParticipations++;
        themeCountMap[theme] = (themeCountMap[theme] || 0) + 1;
        if (badge) manBadges.add(badge);
      }
      uniqueEmployeesTrained += manBadges.size;
    }

    // ── totalQuizzes is returned for display only — NOT added to sensibilisation counts ──
    let totalQuizzes = 0;
    const quizSheet = ss.getSheetByName(SHEETS.QUIZ_RESPONSES);
    if (quizSheet && quizSheet.getLastRow() > 1) {
      totalQuizzes = quizSheet.getLastRow() - 1;
    }

    const sessionBreakdown = Object.entries(themeCountMap)
      .map(([theme, count]) => ({ theme, count }))
      .sort((a, b) => b.count - a.count);

    return { success: true, totalUniqueEmployeesTrained: uniqueEmployeesTrained,
             totalSessionsRecorded, totalParticipations, totalQuizzes, sessionBreakdown };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function getSensibilisationAdminData() {
  try {
    const ss      = getSpreadsheet();
    const records = [];
    const empSheet = ss.getSheetByName(SHEETS.EMPLOYEES);
    if (empSheet && empSheet.getLastRow() > 1) {
      const data    = empSheet.getDataRange().getValues();
      const headers = data[0].map(h => String(h).trim());
      const BASE_COLS = 3;
      for (let r = 1; r < data.length; r++) {
        const row   = data[r];
        const badge = String(row[0] || '').trim().replace(/\.0+$/, '');
        const name  = String(row[1] || '').trim();
        const dept  = String(row[2] || '').trim();
        if (!badge) continue;
       for (let c = BASE_COLS; c < headers.length; c++) {
  const theme = headers[c];
  if (!theme || theme.startsWith('QUIZ:') || theme.startsWith('HYGIENE:')) continue;
  const cellVal = String(row[c] || '').trim();
  if (!cellVal || !cellVal.toLowerCase().startsWith('sensibil')) continue;
          let date = '—', formateur = '—';
          const match = cellVal.match(/Sensibilisé le\s+(\d{2}\/\d{2}\/\d{2})\s+par\s+(.+)/i);
          if (match) { date = match[1]; formateur = match[2].trim(); }
          records.push({ badge, name, department: dept, theme, date, formateur, source: 'EMPLOYEES' });
        }
      }
    }
    const manSheet = ss.getSheetByName(SHEETS.SENSIBILISATION_MANUAL);
    if (manSheet && manSheet.getLastRow() > 1) {
      const manData = manSheet.getDataRange().getValues();
      const pad     = n => String(n).padStart(2, '0');
      for (let i = 1; i < manData.length; i++) {
        const rawDate   = manData[i][0];
        const theme     = String(manData[i][1] || '').trim();
        const formateur = String(manData[i][2] || '').trim();
        const badge     = String(manData[i][3] || '').trim().replace(/\.0+$/, '');
        const name      = String(manData[i][4] || '').trim();
        const dept      = String(manData[i][5] || '').trim();
        if (!theme || !name) continue;
        let dateStr = '—';
        if (rawDate instanceof Date && !isNaN(rawDate)) {
          dateStr = pad(rawDate.getDate()) + '/' + pad(rawDate.getMonth()+1) + '/' + String(rawDate.getFullYear()).slice(-2);
        } else if (rawDate) { dateStr = String(rawDate).slice(0,10); }
        records.push({ badge, name, department: dept, theme, date: dateStr, formateur, source: 'MANUAL' });
      }
    }
    const themes     = [...new Set(records.map(r => r.theme))].sort();
    const formateurs = [...new Set(records.map(r => r.formateur).filter(f => f !== '—'))].sort();
    const depts      = [...new Set(records.map(r => r.department).filter(Boolean))].sort();
    return { success: true, records, themes, formateurs, departments: depts, total: records.length };
  } catch (err) {
    return { success: false, message: err.message, records: [], themes: [], formateurs: [], departments: [] };
  }
}

// ============================================================
// QUIZ MODULE
// ============================================================
function initQuizSheets() {
  const ss = getSpreadsheet();
  createSheetIfNotExists(ss, SHEETS.QUIZ_QUESTIONS, getQuizQuestionHeaders());
  createSheetIfNotExists(ss, SHEETS.QUIZ_RESPONSES, getQuizResponseHeaders());
  _seedDefaultQuizQuestions(ss);
  Logger.log('Quiz sheets initialized.');
  return { success: true, message: 'QUIZ_QUESTIONS et QUIZ_RESPONSES créées.' };

  try { _ensureQuizResponseDeptColumn(); _ensureQuizResponseLevelColumn(); } catch(e){}
}

function _seedDefaultQuizQuestions(ss) {
  const sheet = ss.getSheetByName(SHEETS.QUIZ_QUESTIONS);
  if (!sheet || sheet.getLastRow() > 1) return;

  const questions = [
    ['QZ-001','Hygiène du personnel',
     'Combien de secondes minimum faut-il se laver les mains efficacement ?',
     '10 secondes','20 secondes','30 secondes','60 secondes',
     'C','single','Un lavage efficace dure au minimum 20 à 30 secondes avec savon.','active','','1','','','','',''],
    ['QZ-002','Hygiène du personnel',
     'Parmi les situations suivantes, lesquelles nécessitent un lavage de mains OBLIGATOIRE ?',
     'Avant de manipuler des aliments','Après avoir touché son visage',
     'Après avoir utilisé les toilettes','En arrivant dans la zone de production',
     'A,B,C,D','multi','Toutes ces situations imposent un lavage rigoureux des mains.','active','','1','','','','',''],
    ['QZ-003','Hygiène du personnel',
     'Il est interdit de porter des bijoux dans la zone de production.',
     'VRAI','FAUX','','',
     'A','truefalse','Les bijoux peuvent cacher des bactéries et tomber dans les produits.','active','','1','','','','',''],
    ['QZ-004','Hygiène du personnel',
     'Que faire si vous avez une plaie ouverte sur les mains avant de commencer le travail ?',
     'La couvrir avec un pansement coloré détectable',
     'Continuer normalement','Porter des gants de protection uniquement',
     'Prévenir le responsable et appliquer la procédure médicale',
     'A','single','Un pansement coloré (bleu de préférence) permet la détection en cas de contamination.','active','','1','','','','',''],
    ['QZ-005','Sécurité au travail',
     'Que signifie le pictogramme "triangle jaune avec point d\'exclamation" ?',
     'Danger général','Zone interdite','Équipement obligatoire','Sortie de secours',
     'A','single','Ce pictogramme indique un danger général — restez vigilant.','active','','1','','','','',''],
    ['QZ-006','Sécurité au travail',
     'En cas d\'incendie, vous devez d\'abord utiliser l\'extincteur avant d\'alerter les collègues.',
     'VRAI','FAUX','','',
     'B','truefalse','La priorité est d\'alerter et d\'évacuer.','active','','1','','','','',''],
    ['QZ-007','Food safety sensibilisation',
     'Quelle est la température de danger (zone de croissance bactérienne rapide) ?',
     'Entre 0°C et 4°C','Entre 5°C et 63°C','Entre 63°C et 100°C','Au-dessus de 100°C',
     'B','single','La zone de danger est 5°C–63°C, plage idéale pour la multiplication bactérienne.','active','','1','','','','',''],
    ['QZ-008','Food safety sensibilisation',
     'Quels sont les dangers biologiques en sécurité alimentaire ?',
     'Bactéries pathogènes','Virus (Norovirus, Hépatite A)',
     'Parasites','Moisissures toxinogènes',
     'A,B,C,D','multi','Les 4 catégories sont des dangers biologiques majeurs en FSSC 22000.','active','','1','','','','',''],
    ['QZ-009','Food safety sensibilisation',
     'HACCP signifie "Hazard Analysis Critical Control Points".',
     'VRAI','FAUX','','',
     'A','truefalse','HACCP est le système préventif au cœur de la sécurité alimentaire moderne.','active','','1','','','','',''],
    ['QZ-010','Gestion des allergènes',
     'Combien d\'allergènes majeurs sont reconnus par la réglementation européenne ?',
     '8','12','14','16',
     'C','single','14 allergènes majeurs doivent être déclarés obligatoirement sur les étiquettes.','active','','1','','','','',''],
    ['QZ-011','Nettoyage et désinfection',
     'À quelle couleur correspond généralement le seau de nettoyage du sol selon le code couleur HACCP ?',
     'Bleu','Rouge','Vert','Jaune',
     'B','single','Le seau rouge est réservé au nettoyage du sol selon le code couleur HACCP Palmary.','active','','1','','','','',''],
    ['QZ-012','Nettoyage et désinfection',
     'Le seau rouge est destiné à quel usage ?',
     'Nettoyage sol','Nettoyage machine','Nettoyage sanitaire','Nettoyage vestiaires',
     'A','single','Rouge = sol. Ne jamais croiser les usages pour éviter la contamination croisée.','active','','1','','','','',''],
    ['QZ-013','Bonnes pratiques de fabrication',
     'Le principe FIFO signifie :',
     'Le premier produit rentré doit être le premier sorti',
     'Le dernier produit rentré doit être le premier sorti',
     'Les produits peuvent sortir dans n\'importe quel ordre',
     'Les produits sont triés par taille',
     'A','single','FIFO garantit la rotation des stocks et évite les périmés.','active','','1','','','','',''],
  ];

  questions.forEach(q => sheet.appendRow(q));
  Logger.log('Seeded ' + questions.length + ' demo quiz questions.');
}

function getQuizByTheme(theme, limit, level) {
  try {
    if (!theme || !theme.trim())
      return { success: false, message: 'Thème manquant.' };
    const ss    = getSpreadsheet();
    const sheet = ss.getSheetByName(SHEETS.QUIZ_QUESTIONS);
    if (!sheet || sheet.getLastRow() <= 1)
      return { success: true, questions: [], total: 0, theme };
    const data    = sheet.getDataRange().getValues();
    const maxQ    = (typeof limit === 'number' && limit > 0) ? limit : 10;
    const wantLvl = level ? String(level).trim() : '';
    const results = [];
    for (let i = 1; i < data.length; i++) {
      const row      = data[i];
      const rowTheme = String(row[1] || '').trim();
      const status   = String(row[10] || 'active').trim().toLowerCase();
      if (rowTheme !== theme.trim()) continue;
      if (status === 'deleted' || status === 'inactive') continue;
      var rowLvl = (function(){ var v=String(row[12]||'1').trim(); return (['1','2','3'].indexOf(v)>=0)?v:'1'; })();
      if (wantLvl && wantLvl !== rowLvl) continue;
      const correctRaw = String(row[7] || '').trim().toUpperCase();
      const correct    = correctRaw.split(',').map(c => c.trim()).filter(Boolean);
      const options = [];
      const letters = ['A', 'B', 'C', 'D'];
      const arCols = [14, 15, 16, 17]; // OPTION_A_AR..OPTION_D_AR
      for (let o = 0; o < 4; o++) {
        const val   = String(row[3 + o] || '').trim();
        const valAr = String(row[arCols[o]] || '').trim();
        if (val) options.push({ letter: letters[o], text: val, textAr: valAr });
      }
      results.push({
        id:          String(row[0] || '').trim(),
        theme:       rowTheme,
        question:    String(row[2] || '').trim(),
        questionAr:  String(row[13] || '').trim(),
        level:       rowLvl,
        imageUrl:    String(row[11] || '').trim(),
        options,
        correct,
        type:        String(row[8] || 'single').trim().toLowerCase(),
        explanation: String(row[9] || '').trim(),
      });
      if (results.length >= maxQ) break;
    }
    for (let i = results.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [results[i], results[j]] = [results[j], results[i]];
    }
    return { success: true, questions: results, total: results.length, theme };
  } catch (err) {
    Logger.log('getQuizByTheme error: ' + err);
    return { success: false, message: err.message, questions: [] };
  }
}

function submitQuizAnswers(badge, sessionId, correctCount, totalQ, animateur, details, testType, level) {
  try {
    if (!badge || !sessionId)
      return { success:false, message:'Badge et sessionId obligatoires.' };

    var ss    = getSpreadsheet();
    var sheet = ss.getSheetByName(SHEETS.QUIZ_RESPONSES);
    if (!sheet)
      return { success:false, message:'Feuille QUIZ_RESPONSES introuvable. Lancez initQuizSheets().' };

    // ── PERF: do NOT call _ensureQuizResponseDeptColumn / _ensureQuizResponseLevelColumn here.
    //          They mutate sheet structure and add 2 extra round-trips on every quiz submit.
    //          Run them once in initQuizSheets() / on first install instead.

    var employeeName = 'Anonyme';
    var department   = '—';
    try {
      var emp = findEmployeeByBadge(badge);
      if (emp && emp.success) {
        employeeName = emp.name || employeeName;
        department   = emp.department || '—';
      }
    } catch (e) {}

    var theme       = String(sessionId).split('|')[0] || sessionId;
    var scorePct    = totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0;
    var scoreLabel  = correctCount + '/' + totalQ;
    var responseId  = 'QR-' + Utilities.getUuid().replace(/-/g,'').slice(0,12).toUpperCase();
    var testTypeVal = testType || 'chaud';
    var lvlVal      = (function(){ var v = String(level||'').trim(); return (['1','2','3'].indexOf(v)>=0) ? v : ''; })();

    // ── PERF: single setValues write instead of appendRow + separate setNumberFormat call.
    var lastRow = sheet.getLastRow();
    var rowNum  = lastRow + 1;
    var rowData = [
      responseId, sessionId,
      String(badge).trim().replace(/\.0+$/, ''),
      employeeName, theme, scoreLabel, scorePct, correctCount, totalQ,
      JSON.stringify(details || []),
      new Date(), animateur || '—', testTypeVal, department, lvlVal
    ];
    var range = sheet.getRange(rowNum, 1, 1, rowData.length);
    range.setValues([rowData]);
    // Only format the timestamp cell once (cheap when row already exists)
    if (lastRow <= 1) sheet.getRange(rowNum, 11).setNumberFormat('dd/mm/yyyy hh:mm');

    // Build the response object NOW so we can return ASAP even if helpers throw.
    var response = { success:true, responseId:responseId, scorePct:scorePct, scoreLabel:scoreLabel, employeeName:employeeName, department:department };

    // ── Non-critical: wrap each in try/catch so a slow EMPLOYEES sheet can't block the return.
    try {
      _updateEmployeeQuizColumn(badge, theme, scorePct, correctCount, totalQ, testTypeVal);
    } catch (qce) { Logger.log('_updateEmployeeQuizColumn (non-bloquant): ' + qce); }

    try {
      logAudit('QUIZ_SUBMITTED', responseId, badge,
        'Score: ' + scoreLabel + ' (' + scorePct + '%) | Session: ' + sessionId +
        ' | Type: ' + testTypeVal + ' | Dept: ' + department);
    } catch (le) { Logger.log('logAudit quiz (non-bloquant): ' + le); }

    return response;
  } catch (err) {
    Logger.log('submitQuizAnswers error: ' + err);
    return { success:false, message: err.message };
  }
}

function getQuizStats() {
  try {
    var ss    = getSpreadsheet();
    var sheet = ss.getSheetByName(SHEETS.QUIZ_RESPONSES);
    if (!sheet || sheet.getLastRow() <= 1)
      return { success:true, totalAttempts:0, avgScore:0, byTheme:{}, recent:[], questions:[] };

    var data    = sheet.getDataRange().getValues();
    var headers = data[0].map(String);

    var iBadge  = _quizColIdx(headers,'BADGE',2);
    var iName   = _quizColIdx(headers,'EMPLOYEE_NAME',3);
    var iTheme  = _quizColIdx(headers,'THEME',4);
    var iScore  = _quizColIdx(headers,'SCORE',5);
    var iPct    = _quizColIdx(headers,'SCORE_PCT',6);
    var iCorrect= _quizColIdx(headers,'CORRECT_COUNT',7);
    var iTotalQ = _quizColIdx(headers,'TOTAL_Q',8);
    var iDet    = _quizColIdx(headers,'DETAILS',9);
    var iTs     = _quizColIdx(headers,'TIMESTAMP',10);
    var iAnim   = _quizColIdx(headers,'ANIMATEUR',11);
    var iType   = _quizColIdx(headers,'TEST_TYPE',12);
    var iDept   = _quizColIdx(headers,'DEPARTMENT',-1);
    var iLevel  = _quizColIdx(headers,'LEVEL',-1);

    var totalPct=0, count=0;
    var byTheme = {};
    var recent  = [];

    for (var i=1;i<data.length;i++) {
      var row   = data[i];
      var theme = String(row[iTheme]||'').trim();
      var pct   = Number(row[iPct]||0);
      var ts    = row[iTs];
      var dept  = iDept>=0 ? String(row[iDept]||'').trim() : '';
      if (!dept) {
        try {
          var emp = findEmployeeByBadge(String(row[iBadge]||'').trim());
          if (emp && emp.success) dept = emp.department || '—';
        } catch(e) {}
      }
      if (!dept) dept = '—';

      totalPct += pct;
      count++;

      if (!byTheme[theme]) byTheme[theme] = { count:0, totalPct:0 };
      byTheme[theme].count++;
      byTheme[theme].totalPct += pct;

      recent.push({
        badge:        String(row[iBadge]||'').trim(),
        name:         String(row[iName]||'').trim(),
        department:   dept, dept,
        theme,
        score:        String(row[iScore]||'').trim(),
        pct,
        correctCount: Number(row[iCorrect]||0),
        totalQ:       Number(row[iTotalQ]||0),
        details:      String(row[iDet]||''),
        date:         ts instanceof Date ? ts.toLocaleDateString('fr-FR') : '—',
        timestamp:    ts instanceof Date ? ts.getTime() : 0,
        animateur:    String(row[iAnim]||'').trim(),
        testType:     String(row[iType]||'chaud').trim() || 'chaud',
        level:        iLevel>=0 ? String(row[iLevel]||'').trim() : ''
      });
    }

    Object.keys(byTheme).forEach(function(t){
      byTheme[t].avgPct = Math.round(byTheme[t].totalPct / byTheme[t].count);
    });

    var qBank = [];
    try {
      var qSheet = ss.getSheetByName(SHEETS.QUIZ_QUESTIONS);
      if (qSheet && qSheet.getLastRow() > 1) {
        var qData = qSheet.getDataRange().getValues();
        for (var j=1;j<qData.length;j++) {
          qBank.push({ id:String(qData[j][0]).trim(), theme:String(qData[j][1]).trim(), question:String(qData[j][2]).trim() });
        }
      }
    } catch(e) {}

    return {
      success:       true,
      totalAttempts: count,
      avgScore:      count ? Math.round(totalPct / count) : 0,
      byTheme,
      recent:        recent.slice(-500).reverse(),
      questions:     qBank
    };
  } catch (err) {
    Logger.log('getQuizStats error: ' + err);
    return { success:false, message: err.message };
  }
}

function getQuizQuestions(theme) {
  try {
    const ss    = getSpreadsheet();
    const sheet = ss.getSheetByName(SHEETS.QUIZ_QUESTIONS);
    if (!sheet || sheet.getLastRow() <= 1) return { success: true, data: [] };
    const data = sheet.getDataRange().getValues();
    const list = [];
    for (let i = 1; i < data.length; i++) {
      const row    = data[i];
      const status = String(row[10] || '').trim().toLowerCase();
      if (status === 'deleted') continue;
      if (theme && String(row[1] || '').trim() !== theme.trim()) continue;
      list.push({
        id:          String(row[0]).trim(),
        theme:       String(row[1]).trim(),
        question:    String(row[2]).trim(),
        optionA:     String(row[3]).trim(),
        optionB:     String(row[4]).trim(),
        optionC:     String(row[5]).trim(),
        optionD:     String(row[6]).trim(),
        correct:     String(row[7]).trim(),
        type:        String(row[8]).trim(),
        explanation: String(row[9]).trim(),
        status:      status || 'active',
        imageUrl:    String(row[11] || '').trim(),
        level:       (function(){ var v=String(row[12]||'1').trim(); return (['1','2','3'].indexOf(v)>=0)?v:'1'; })(),
        questionAr:  String(row[13] || '').trim(),
        optionA_Ar:  String(row[14] || '').trim(),
        optionB_Ar:  String(row[15] || '').trim(),
        optionC_Ar:  String(row[16] || '').trim(),
        optionD_Ar:  String(row[17] || '').trim(),
        _row:        i + 1,
      });
    }
    return { success: true, data: list };
  } catch (err) {
    return { success: false, message: err.message, data: [] };
  }
}


function _ensureQuizQuestionExtCols(sheet) {
  try {
    if (!sheet) return;
    var need = 18;
    if (sheet.getLastColumn() < need) {
      sheet.insertColumnsAfter(sheet.getLastColumn(), need - sheet.getLastColumn());
      var heads = ['LEVEL','QUESTION_TEXT_AR','OPTION_A_AR','OPTION_B_AR','OPTION_C_AR','OPTION_D_AR'];
      sheet.getRange(1,13,1,6).setValues([heads]);
    }
  } catch(e) { Logger.log('_ensureQuizQuestionExtCols: '+e); }
}
function _ensureQuizResponseLevelColumn() {
  try {
    var sh = getSpreadsheet().getSheetByName(SHEETS.QUIZ_RESPONSES);
    if (!sh) return;
    var headers = sh.getRange(1,1,1,Math.max(1,sh.getLastColumn())).getValues()[0].map(String);
    if (headers.indexOf('LEVEL') < 0) {
      sh.insertColumnAfter(sh.getLastColumn());
      sh.getRange(1, sh.getLastColumn()).setValue('LEVEL');
    }
  } catch(e) { Logger.log('_ensureQuizResponseLevelColumn: '+e); }
}

function saveQuizQuestion(qData, userEmail) {
  try {
    const ss    = getSpreadsheet();
    const sheet = ss.getSheetByName(SHEETS.QUIZ_QUESTIONS);
    if (!sheet) return { success: false, message: 'Feuille QUIZ_QUESTIONS introuvable.' };
    _ensureQuizQuestionExtCols(sheet);
    const required = ['theme', 'question', 'optionA', 'optionB', 'correct', 'type'];
    for (const key of required) {
      if (!qData[key] || !String(qData[key]).trim())
        return { success: false, message: 'Champ obligatoire manquant : ' + key };
    }
    var _lvl = String(qData.level || '1').trim();
    if (['1','2','3'].indexOf(_lvl) < 0) _lvl = '1';
    const rowData = [
      qData.id || ('QZ-' + Date.now()),
      String(qData.theme).trim(),
      String(qData.question).trim(),
      String(qData.optionA || '').trim(),
      String(qData.optionB || '').trim(),
      String(qData.optionC || '').trim(),
      String(qData.optionD || '').trim(),
      String(qData.correct).toUpperCase().trim(),
      String(qData.type || 'single').trim(),
      String(qData.explanation || '').trim(),
      qData.status || 'active',
      String(qData.imageUrl || '').trim(),
      _lvl,
      String(qData.questionAr  || '').trim(),
      String(qData.optionA_Ar  || '').trim(),
      String(qData.optionB_Ar  || '').trim(),
      String(qData.optionC_Ar  || '').trim(),
      String(qData.optionD_Ar  || '').trim(),
    ];
    if (qData.id) {
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]).trim() === String(qData.id).trim()) {
          sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
          logAudit('QUIZ_Q_UPDATED', qData.id, userEmail || 'ADMIN', qData.theme);
          return { success: true, id: qData.id, message: 'Question mise à jour.' };
        }
      }
    }
    rowData[0] = 'QZ-' + Date.now();
    sheet.appendRow(rowData);
    logAudit('QUIZ_Q_CREATED', rowData[0], userEmail || 'ADMIN', qData.theme);
    return { success: true, id: rowData[0], message: 'Question créée.' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}


function updateQuizQuestionStatus(questionId, status, userEmail) {
  try {
    if (!questionId) return { success: false, message: 'questionId requis.' };
    const normalized = (String(status || '').toLowerCase() === 'inactive') ? 'inactive' : 'active';
    const ss    = getSpreadsheet();
    const sheet = ss.getSheetByName(SHEETS.QUIZ_QUESTIONS);
    if (!sheet) return { success: false, message: 'Feuille QUIZ_QUESTIONS introuvable.' };
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(questionId).trim()) {
        sheet.getRange(i + 1, 11).setValue(normalized);
        logAudit('QUIZ_Q_STATUS', questionId, userEmail || 'ADMIN', normalized);
        return { success: true, id: questionId, status: normalized, message: 'Statut mis à jour.' };
      }
    }
    return { success: false, message: 'Question introuvable : ' + questionId };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function deleteQuizQuestion(questionId, userEmail) {
  try {
    const ss    = getSpreadsheet();
    const sheet = ss.getSheetByName(SHEETS.QUIZ_QUESTIONS);
    if (!sheet) return { success: false, message: 'Feuille introuvable.' };
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() !== String(questionId).trim()) continue;
      sheet.getRange(i + 1, 11).setValue('deleted');
      logAudit('QUIZ_Q_DELETED', questionId, userEmail || 'ADMIN', data[i][1]);
      return { success: true, message: 'Question supprimée.' };
    }
    return { success: false, message: 'Question introuvable : ' + questionId };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// ============================================================
// DEBUG FUNCTIONS
// ============================================================
function debugCheckSystem() {
  const ss = getSpreadsheet();
  Logger.log('=== SafeTrack v5.8.1 Debug ===');
  Object.values(SHEETS).forEach(name => {
    const s = ss.getSheetByName(name);
    Logger.log(s ? '['+name+']: OK — '+(s.getLastRow()-1)+' rows' : '['+name+']: MISSING');
  });
  Logger.log('getSensibilisationConfig: ' + JSON.stringify(getSensibilisationConfig()));
  Logger.log('getSensibilisationStats: '  + JSON.stringify(getSensibilisationStats()));
  Logger.log('getEmployeeSensibilisationHistory(1001): ' + JSON.stringify(getEmployeeSensibilisationHistory('1001')));
  Logger.log('getEmployeeHygieneHistory(1001): ' + JSON.stringify(getEmployeeHygieneHistory('1001')));
  Logger.log('getQuizStats: ' + JSON.stringify(getQuizStats()));
}

function getDeploymentUrl() {
  try {
    const url = ScriptApp.getService().getUrl();
    return { success: true, url: url };
  } catch (err) {
    Logger.log('getDeploymentUrl error: ' + err);
    return { success: false, message: err.message };
  }
}

// ============================================================
// QUIZ — Helpers
// ============================================================
function _ensureQuizResponseDeptColumn() {
  var ss = getSpreadsheet();
  var sh = ss.getSheetByName(SHEETS.QUIZ_RESPONSES);
  if (!sh) return { success:false, message:'QUIZ_RESPONSES introuvable' };
  var lastCol = sh.getLastColumn();
  var headers = sh.getRange(1,1,1,lastCol).getValues()[0].map(String);
  if (headers.indexOf('DEPARTMENT') === -1) {
    sh.getRange(1, lastCol+1).setValue('DEPARTMENT');
    Logger.log('Colonne DEPARTMENT ajoutee a QUIZ_RESPONSES.');
  }
  return { success:true };
}

function _quizColIdx(headers, name, fallback) {
  var i = headers.indexOf(name);
  return i >= 0 ? i : (typeof fallback === 'number' ? fallback : -1);
}

// ============================================================
// QUIZ COLUMN IN EMPLOYEES SHEET
// ============================================================
function _updateEmployeeQuizColumn(badge, theme, scorePct, correctCount, totalQ, testType) {
  if (!badge || !theme) return;

  var ss       = getSpreadsheet();
  var empSheet = ss.getSheetByName(SHEETS.EMPLOYEES);
  if (!empSheet) return;

  var badgeNorm = String(badge).trim().replace(/\.0+$/, '').replace(/^0+([0-9]+)$/, '$1');
  var colHeader = 'QUIZ: ' + theme.trim();

  var now   = new Date();
  var pad   = function(n){ return String(n).padStart(2,'0'); };
  var dateStr  = pad(now.getDate()) + '/' + pad(now.getMonth()+1) + '/' + String(now.getFullYear()).slice(-2);
  var typeLabel = (testType === 'froid') ? ' [froid]' : ' [chaud]';
  var cellVal   = 'Quiz le ' + dateStr + ' — ' + correctCount + '/' + totalQ + ' (' + scorePct + '%)' + typeLabel;

  var lastCol = empSheet.getLastColumn();
  var headers = empSheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h){ return String(h).trim(); });
  var colIdx  = headers.indexOf(colHeader);

  if (colIdx < 0) {
    var newColNum = lastCol + 1;
    empSheet.getRange(1, newColNum).setValue(colHeader);
    empSheet.getRange(1, newColNum)
      .setBackground('#1a3a2a')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
    colIdx  = newColNum - 1;
    lastCol = newColNum;
  }
  var colNum = colIdx + 1;

  if (empSheet.getLastRow() <= 1) return;
  var badgeValues = empSheet.getRange(2, 1, empSheet.getLastRow()-1, 1).getValues();
  var rowNum = -1;
  for (var i = 0; i < badgeValues.length; i++) {
    var b = String(badgeValues[i][0] || '').trim().replace(/\.0+$/, '').replace(/^0+([0-9]+)$/, '$1');
    if (b === badgeNorm) { rowNum = i + 2; break; }
  }
  if (rowNum < 0) return;

  empSheet.getRange(rowNum, colNum).setValue(cellVal);
}

// ============================================================
// PRP HYGIENE MODULE (v5.8.1)
// ============================================================
function getHygienePrpHeaders() {
  return [
    'CHECKLIST_ID','TIMESTAMP','VER_DATE','VER_TIME','VER_NAME',
    'SHIFT','ZONE','EMP_BADGE','EMP_NAME','EMP_DEPT',
    'NC_COUNT','OK_COUNT','TOTAL_DONE','SEVERITY',
    'PRP_TENUE','PRP_PROPRE','PRP_BIJOUX','PRP_MAINS',
    'PRP_PLAIES','PRP_ONGLES','PRP_GANTS','PRP_HYGIENE',
    'NC_DETAILS','COMMENTS','PHOTO_URL','STATUS',
  ];
}

// ============================================================
// SUBMIT PRP HYGIENE — v5.8.1 (with EMPLOYEES history tracking)
// ============================================================
function submitPrpHygiene(formData) {
  try {
    if (!formData || !formData.empBadge || !formData.verName)
      return { success: false, message: 'Données manquantes.' };

    const ss = getSpreadsheet();

    let sheet = ss.getSheetByName('PRP_HYGIENE');
    if (!sheet) {
      sheet = ss.insertSheet('PRP_HYGIENE');
      const headers = getHygienePrpHeaders();
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length)
        .setBackground('#1a3c5e').setFontColor('#ffffff').setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    const now        = new Date();
    const checklistId = _generateHygId(now, sheet.getLastRow());

    const ncIds = (formData.ncList || []).map(n => n.itemId);
    const okIds = ['tenue','propre','bijoux','mains','plaies','ongles','gants','hygiene']
      .filter(id => !ncIds.includes(id));
    const prpMap = {};
    ['tenue','propre','bijoux','mains','plaies','ongles','gants','hygiene'].forEach(id => {
      if (ncIds.includes(id))      prpMap[id] = 'nc';
      else if (okIds.includes(id)) prpMap[id] = 'ok';
      else                         prpMap[id] = '';
    });

    let photoUrl = '';
    if (formData.photoData && formData.photoData.length > 100) {
      try {
        photoUrl = _uploadHygienePhoto(formData.photoData, checklistId, formData.empDept || 'Hygiène');
      } catch(pe) {
        Logger.log('Hygiene photo upload error: ' + pe);
      }
    }

    const row = [
      checklistId, now,
      formData.verDate    || '',
      formData.verTime    || '',
      formData.verName    || '',
      formData.shift      || '',
      formData.zone       || '',
      String(formData.empBadge || '').trim().replace(/\.0+$/, '').replace(/^0+([0-9]+)$/, '$1'),
      formData.empName    || '',
      formData.empDept    || '',
      Number(formData.ncCount  || 0),
      Number(formData.okCount  || 0),
      Number(formData.totalDone|| 0),
      formData.severity   || 'Conforme',
      prpMap.tenue   || '',
      prpMap.propre  || '',
      prpMap.bijoux  || '',
      prpMap.mains   || '',
      prpMap.plaies  || '',
      prpMap.ongles  || '',
      prpMap.gants   || '',
      prpMap.hygiene || '',
      JSON.stringify(formData.ncList || []),
      formData.comments || '',
      photoUrl,
      'OPEN',
    ];

    sheet.appendRow(row);
    sheet.getRange(sheet.getLastRow(), 2).setNumberFormat('dd/mm/yyyy hh:mm');

    // ── FIX v5.8.1 : WRITE TO EMPLOYEES SHEET (history tracking) ──
    try {
      _updateEmployeeHygieneColumn(formData);
    } catch(he) {
      Logger.log('_updateEmployeeHygieneColumn error (non-bloquant): ' + he);
    }

    // Si NC, créer aussi un REPORT automatique dans la feuille REPORTS
    if (Number(formData.ncCount || 0) > 0) {
      try {
        _createReportFromHygiene(formData, checklistId, photoUrl);
      } catch(re) {
        Logger.log('Auto-report from hygiene error: ' + re);
      }
    }

    try {
      logAudit(
        'PRP_HYGIENE_SUBMITTED', checklistId,
        formData.verName || 'QUALITE',
        `Badge: ${formData.empBadge} | ${formData.empName} | NC: ${formData.ncCount} | Shift: ${formData.shift}`
      );
    } catch(e) {}

    return {
      success:     true,
      checklistId: checklistId,
      message:     `Contrôle hygiène enregistré: ${checklistId}`,
      ncCount:     formData.ncCount || 0,
    };
  } catch (err) {
    Logger.log('submitPrpHygiene error: ' + err);
    return { success: false, message: err.message };
  }
}

// ============================================================
// AUTO-CREATE REPORT WHEN NC FOUND
// ============================================================
function _createReportFromHygiene(formData, checklistId, photoUrl) {
  const ncLabels = (formData.ncList || []).map(n => `• ${n.label}: ${n.obs}`).join('\n');
  const desc = `[PRP Hygiène] Contrôle nominatif — ${formData.empName} (Badge: ${formData.empBadge})\n` +
               `Shift: ${formData.shift} | Zone: ${formData.zone || '—'}\n\n` +
               `Anomalies détectées:\n${ncLabels}`;
  const severityMap = { Conforme: 'Low', Mineure: 'Low', Majeure: 'Medium', Critique: 'High' };
  _writeReport({
    employeeName:    formData.verName || 'Qualité',
    department:      formData.empDept || 'Production',
    zone:            formData.zone || '',
    productionLine:  formData.shift || '',
    incidentType:    "Défaut d'hygiène personnel",
    severity:        severityMap[formData.severity] || 'Medium',
    description:     desc,
    immediateAction: formData.comments || '',
    photoData:       '',
    isAnonymous:     false,
    language:        'FR',
    photoUrl:        photoUrl,
  }, null, formData.verName || 'QUALITE');
}

// ============================================================
// GET HYGIENE PRP DATA
// ============================================================
function getHygienePrpData(filters) {
  try {
    const ss    = getSpreadsheet();
    const sheet = ss.getSheetByName('PRP_HYGIENE');
    if (!sheet || sheet.getLastRow() <= 1) return { success: true, data: [] };

    const headers = getHygienePrpHeaders();
    const values  = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();

    let data = values.map((row, i) => {
      const r = {};
      headers.forEach((h, j) => { r[h] = row[j]; });
      r._row = i + 2;
      const rawTs = row[1];
      if (rawTs instanceof Date && !isNaN(rawTs)) r.timestamp = rawTs.toISOString();
      else if (rawTs) { try { r.timestamp = new Date(rawTs).toISOString(); } catch(e){ r.timestamp=''; } }
      else r.timestamp = '';
      try { r.NC_DETAILS_PARSED = JSON.parse(r.NC_DETAILS || '[]'); }
      catch(e) { r.NC_DETAILS_PARSED = []; }
      return r;
    }).filter(r => String(r['CHECKLIST_ID'] || '').trim() !== '');

    filters = filters || {};
    if (filters.empBadge) {
      const normBadge = b => String(b || '').trim().replace(/\.0+$/, '').replace(/^0+([0-9]+)$/, '$1');
      const targetBadge = normBadge(filters.empBadge);
      data = data.filter(r => normBadge(r.EMP_BADGE) === targetBadge);
    }
    if (filters.verName)  data = data.filter(r => (r.VER_NAME || '').toLowerCase().includes(filters.verName.toLowerCase()));
    if (filters.shift)    data = data.filter(r => r.SHIFT === filters.shift);
    if (filters.zone)     data = data.filter(r => r.ZONE === filters.zone);
    if (filters.severity) data = data.filter(r => r.SEVERITY === filters.severity);
    if (filters.status)   data = data.filter(r => r.STATUS === filters.status);
    if (filters.dateFrom) data = data.filter(r => r.timestamp && new Date(r.timestamp) >= new Date(filters.dateFrom));
    if (filters.dateTo)   data = data.filter(r => r.timestamp && new Date(r.timestamp) <= new Date(filters.dateTo));
    if (filters.search) {
      const q = filters.search.toLowerCase();
      data = data.filter(r =>
        (r.CHECKLIST_ID || '').toLowerCase().includes(q) ||
        (r.EMP_NAME     || '').toLowerCase().includes(q) ||
        (r.EMP_BADGE    || '').toLowerCase().includes(q) ||
        (r.VER_NAME     || '').toLowerCase().includes(q)
      );
    }

    data.sort((a, b) => !a.timestamp ? 1 : !b.timestamp ? -1 : new Date(b.timestamp) - new Date(a.timestamp));
    return { success: true, data };
  } catch(err) {
    Logger.log('getHygienePrpData error: ' + err);
    return { success: false, message: err.message, data: [] };
  }
}

// ============================================================
// GET HYGIENE KPIs
// ============================================================
function getHygieneKpis() {
  try {
    const res = getHygienePrpData({});
    if (!res.success) return res;
    const data   = res.data;
    const now    = new Date();
    const mm = now.getMonth(), yy = now.getFullYear();

    const criteriaKeys = ['tenue','propre','bijoux','mains','plaies','ongles','gants','hygiene'];
    const criteriaLabels = {
      tenue:   'Tenue réglementaire',   propre:  'Tenues propres',
      bijoux:  'Bijoux',                mains:   'Mains propres',
      plaies:  'Plaies non protégées',  ongles:  'Ongles',
      gants:   'Gants',                 hygiene: 'Comportement hygiénique',
    };
    const ncByCriteria = {};
    criteriaKeys.forEach(k => { ncByCriteria[criteriaLabels[k]] = 0; });
    data.forEach(r => {
      criteriaKeys.forEach(k => {
        if ((r['PRP_' + k.toUpperCase()] || '') === 'nc')
          ncByCriteria[criteriaLabels[k]]++;
      });
    });

    const ncByEmployee = {};
    data.forEach(r => {
      if (Number(r.NC_COUNT || 0) > 0) {
        const key = (r.EMP_NAME || r.EMP_BADGE || 'Inconnu');
        if (!ncByEmployee[key]) ncByEmployee[key] = { badge: r.EMP_BADGE, name: r.EMP_NAME, dept: r.EMP_DEPT, count: 0 };
        ncByEmployee[key].count += Number(r.NC_COUNT || 0);
      }
    });
    const topRecidivists = Object.values(ncByEmployee).sort((a, b) => b.count - a.count).slice(0, 10);

    return {
      success: true,
      kpis: {
        total:     data.length,
        conformes: data.filter(r => r.SEVERITY === 'Conforme').length,
        nc:        data.filter(r => r.SEVERITY !== 'Conforme').length,
        critique:  data.filter(r => r.SEVERITY === 'Critique').length,
        majeure:   data.filter(r => r.SEVERITY === 'Majeure').length,
        mineure:   data.filter(r => r.SEVERITY === 'Mineure').length,
        thisMonth: data.filter(r => {
          if (!r.timestamp) return false;
          const d = new Date(r.timestamp);
          return d.getMonth() === mm && d.getFullYear() === yy;
        }).length,
        open:           data.filter(r => r.STATUS === 'OPEN').length,
        ncByCriteria,
        topRecidivists,
        byShift:        _groupByField(data, 'SHIFT'),
        byZone:         _groupByField(data, 'ZONE'),
        bySeverity:     _groupByField(data, 'SEVERITY'),
        recentChecks:   data.slice(0, 10),
      }
    };
  } catch(err) {
    Logger.log('getHygieneKpis error: ' + err);
    return { success: false, message: err.message };
  }
}

function _groupByField(data, field) {
  return data.reduce((acc, item) => {
    const val = String(item[field] || 'Inconnu').trim() || 'Inconnu';
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});
}

// ============================================================
// GET EMPLOYEE HYGIENE HISTORY — v5.8.1 (dual-source)
// ============================================================
function getEmployeeHygieneHistory(badgeNumber) {
  try {
    if (!badgeNumber || String(badgeNumber).trim() === '')
      return { success: false, message: 'Badge manquant.' };

    const ss    = getSpreadsheet();
    const badge = String(badgeNumber).trim().replace(/\.0+$/, '').replace(/^0+([0-9]+)$/,'$1');
    const history = [];

    // SOURCE 1 : Colonnes HYGIENE: dans la feuille EMPLOYEES
    const empSheet = ss.getSheetByName(SHEETS.EMPLOYEES);
    if (empSheet && empSheet.getLastRow() > 1) {
      const data    = empSheet.getDataRange().getValues();
      const headers = data[0].map(function(h) { return String(h).trim(); });
      const BASE_COLS = 3;

      var employeeRow    = null;
      var employeeRowIdx = -1;
      for (var r = 1; r < data.length; r++) {
        var rowBadge = String(data[r][0] || '').trim().replace(/\.0+$/, '').replace(/^0+([0-9]+)$/,'$1');
        if (rowBadge === badge) {
          employeeRow    = data[r];
          employeeRowIdx = r;
          break;
        }
      }

      if (employeeRow) {
        for (var c = BASE_COLS; c < headers.length; c++) {
          var colName = headers[c];
          if (!colName.startsWith('HYGIENE:')) continue;

          var cellVal = String(employeeRow[c] || '').trim();
          if (!cellVal || !cellVal.toLowerCase().startsWith('sensibil')) continue;

          var date = '—', ncCount = 0, verName = '—', ncDetails = '';
          var match = cellVal.match(/(?:NC|Conforme) le\s+(\d{2}\/\d{2}\/\d{2})\s+—\s+(\d+)\s+NC\s+—\s+par\s+(.+?)(?:\s+\|\s+(.+))?$/i);
          if (match) {
            date      = match[1];
            ncCount   = parseInt(match[2]) || 0;
            verName   = match[3].trim();
            ncDetails = match[4] ? match[4].trim() : '';
          } else {
            var simpleMatch = cellVal.match(/le\s+(\d{2}\/\d{2}\/\d{2})/i);
            if (simpleMatch) date = simpleMatch[1];
            var parMatch = cellVal.match(/par\s+([^|]+)/i);
            if (parMatch) verName = parMatch[1].trim().split('|')[0].trim();
          }

          var zone = colName.replace('HYGIENE:', '').trim();
          history.push({
            id:        'EMP-' + employeeRowIdx + '-' + c,
            zone:      zone || '—',
            date:      date,
            ncCount:   ncCount,
            verName:   verName,
            ncDetails: ncDetails,
            ncList:    [],
            source:    'EMPLOYEES'
          });
        }
      }
    }

    // SOURCE 2 : Feuille PRP_HYGIENE
    const hygSheet = ss.getSheetByName(SHEETS.PRP_HYGIENE);
    if (hygSheet && hygSheet.getLastRow() > 1) {
      var hygData    = hygSheet.getDataRange().getValues();
      var hygHeaders = hygData[0].map(function(h) { return String(h).trim(); });

      var idxBadge   = hygHeaders.indexOf('EMP_BADGE');
      var idxDate    = hygHeaders.indexOf('VER_DATE');
      var idxZone    = hygHeaders.indexOf('ZONE');
      var idxNcCount = hygHeaders.indexOf('NC_COUNT');
      var idxVerName = hygHeaders.indexOf('VER_NAME');
      var idxNcDet   = hygHeaders.indexOf('NC_DETAILS');
      var idxCheckId = hygHeaders.indexOf('CHECKLIST_ID');

      for (var i = 1; i < hygData.length; i++) {
        var rowBadge2 = String(hygData[i][idxBadge] || '').trim().replace(/\.0+$/, '').replace(/^0+([0-9]+)$/,'$1');
        if (rowBadge2 !== badge) continue;

        var rawDate = hygData[i][idxDate];
        var dateStr = '—';
        if (rawDate instanceof Date && !isNaN(rawDate)) {
          var d  = rawDate.getDate();
          var mo = rawDate.getMonth() + 1;
          var yr = String(rawDate.getFullYear()).slice(-2);
          dateStr = (d < 10 ? '0' : '') + d + '/' + (mo < 10 ? '0' : '') + mo + '/' + yr;
        } else if (rawDate) {
          dateStr = String(rawDate).slice(0, 10);
        }

        var nc2      = Number(hygData[i][idxNcCount] || 0);
        var zone2    = String(hygData[i][idxZone]    || '—').trim();
        var verName2 = String(hygData[i][idxVerName] || '—').trim();

        var ncDetailsStr2 = '';
        var ncList2 = [];
        try {
          var arr = JSON.parse(String(hygData[i][idxNcDet] || '[]'));
          if (Array.isArray(arr) && arr.length) {
            ncList2 = arr;
            ncDetailsStr2 = arr.map(function(d) { return d.label + ': ' + d.obs; }).join(', ');
          }
        } catch(e) {
          ncDetailsStr2 = String(hygData[i][idxNcDet] || '');
        }

        history.push({
          id:        String(hygData[i][idxCheckId] || ''),
          zone:      zone2,
          date:      dateStr,
          ncCount:   nc2,
          verName:   verName2,
          ncDetails: ncDetailsStr2,
          ncList:    ncList2,
          source:    'PRP_HYGIENE'
        });
      }
    }

    // Sort: most recent first
    history.sort(function(a, b) {
      if (a.date === '—') return 1;
      if (b.date === '—') return -1;
      var toSort = function(d) {
        var p = d.split('/');
        return p.length === 3 ? p[2] + p[1] + p[0] : d;
      };
      return toSort(b.date).localeCompare(toSort(a.date));
    });

    return { success: true, history: history };
  } catch (err) {
    Logger.log('getEmployeeHygieneHistory error: ' + err);
    return { success: false, message: err.message };
  }
}

// ============================================================
// UPDATE STATUS
// ============================================================
function updateHygieneStatus(checklistId, status, userEmail) {
  try {
    const ss    = getSpreadsheet();
    const sheet = ss.getSheetByName('PRP_HYGIENE');
    if (!sheet) return { success: false, message: 'Feuille PRP_HYGIENE introuvable.' };
    const headers = getHygienePrpHeaders();
    const idIdx   = headers.indexOf('CHECKLIST_ID');
    const stIdx   = headers.indexOf('STATUS');
    const values  = sheet.getDataRange().getValues();
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][idIdx]).trim() !== String(checklistId).trim()) continue;
      sheet.getRange(i + 1, stIdx + 1).setValue(status);
      try { logAudit('HYGIENE_STATUS_UPDATED', checklistId, userEmail || 'ADMIN', 'Statut → ' + status); } catch(e) {}
      return { success: true, message: 'Statut mis à jour.' };
    }
    return { success: false, message: 'Checklist introuvable: ' + checklistId };
  } catch(err) {
    return { success: false, message: err.message };
  }
}

// ============================================================
// PHOTO UPLOAD
// ============================================================
function _uploadHygienePhoto(base64Data, checklistId, dept) {
  const base64      = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
  const contentType = base64Data.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
  const ext         = contentType === 'image/png' ? 'png' : 'jpg';
  const fileName    = `HYG_${checklistId}_${Date.now()}.${ext}`;
  const blob        = Utilities.newBlob(Utilities.base64Decode(base64), contentType, fileName);
  const root        = getDriveFolder();
  const hygieneF   = getOrCreateFolder(root, 'PRP_Hygiene_Evidence');
  const now         = new Date();
  const yearF       = getOrCreateFolder(hygieneF, now.getFullYear().toString());
  const deptF       = getOrCreateFolder(yearF, dept || 'Production');
  const file        = deptF.createFile(blob);
  file.setName(fileName);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}

// ============================================================
// ID GENERATOR
// ============================================================
function _generateHygId(now, lastRow) {
  const pad = n => String(n).padStart(2, '0');
  const dateTag = now.getFullYear().toString().slice(-2) + pad(now.getMonth()+1) + pad(now.getDate());
  const seq = String(Math.max(1, lastRow)).padStart(4, '0');
  return 'HYG-' + dateTag + '-' + seq;
}

// ============================================================
// EXPORT CSV HYGIENE
// ============================================================
function exportHygieneCSV() {
  try {
    const res = getHygienePrpData({});
    if (!res.success) return res;
    const headers = [
      'ID','Date','Heure','Vérificateur','Shift','Zone',
      'Badge','Employé','Département',
      'NC','OK','Total','Sévérité',
      'Tenue','Propre','Bijoux','Mains','Plaies','Ongles','Gants','Hygiène comportementale',
      'Observations NC','Commentaires','Photo','Statut'
    ];
    const prpCols = ['PRP_TENUE','PRP_PROPRE','PRP_BIJOUX','PRP_MAINS','PRP_PLAIES','PRP_ONGLES','PRP_GANTS','PRP_HYGIENE'];
    const rows = [headers.map(h => `"${h}"`).join(',')];
    res.data.forEach(r => {
      const ncObs = (r.NC_DETAILS_PARSED || []).map(n => `${n.label}: ${n.obs}`).join(' | ');
      rows.push([
        r.CHECKLIST_ID, r.VER_DATE, r.VER_TIME, r.VER_NAME, r.SHIFT, r.ZONE,
        r.EMP_BADGE, r.EMP_NAME, r.EMP_DEPT,
        r.NC_COUNT, r.OK_COUNT, r.TOTAL_DONE, r.SEVERITY,
        ...prpCols.map(c => r[c] || ''),
        ncObs, r.COMMENTS, r.PHOTO_URL, r.STATUS
      ].map(v => `"${String(v === null || v === undefined ? '' : v).replace(/"/g,'""')}"`).join(','));
    });
    return { success: true, csv: rows.join('\n'), filename: 'PRP_Hygiene_Export_' + Date.now() + '.csv' };
  } catch(err) {
    return { success: false, message: err.message };
  }
}

// ============================================================
// _updateEmployeeHygieneColumn — v5.8.1 (NEW)
// Writes/updates a "HYGIENE: [Zone]" column in EMPLOYEES sheet
// to track hygiene history per employee (mirrors Sensibilisation/Quiz pattern).
// ============================================================
function _updateEmployeeHygieneColumn(formData) {
  if (!formData || !formData.empBadge) return;

  const ss       = getSpreadsheet();
  const empSheet = ss.getSheetByName(SHEETS.EMPLOYEES);
  if (!empSheet) return;

  const badgeNorm = String(formData.empBadge).trim().replace(/\.0+$/, '').replace(/^0+([0-9]+)$/, '$1');
  const zone      = String(formData.zone || '—').trim();
  const colHeader = 'HYGIENE: ' + zone;

  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const dateStr = pad(now.getDate()) + '/' + pad(now.getMonth() + 1) + '/' + String(now.getFullYear()).slice(-2);

  const ncCount      = Number(formData.ncCount || 0);
  const ncList       = formData.ncList || [];
  const ncDetailsStr = ncList.length > 0
    ? ncList.map(n => `${n.label}: ${n.obs}`).join(', ')
    : '';

  const statusLabel = ncCount === 0 ? 'Conforme' : 'NC';
  const cellVal = statusLabel + ' le ' + dateStr +
                  ' — ' + ncCount + ' NC' +
                  ' — par ' + (formData.verName || '—') +
                  (ncDetailsStr ? ' | ' + ncDetailsStr : '');

  let lastCol = empSheet.getLastColumn();
  const headers = empSheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h).trim());
  let colIdx = headers.indexOf(colHeader);

  if (colIdx < 0) {
    const newColNum = lastCol + 1;
    empSheet.getRange(1, newColNum).setValue(colHeader);
    empSheet.getRange(1, newColNum)
      .setBackground('#3c1a1a')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
    colIdx  = newColNum - 1;
    lastCol = newColNum;
  }
  const colNum = colIdx + 1;

  if (empSheet.getLastRow() <= 1) return;

  const badgeValues = empSheet.getRange(2, 1, empSheet.getLastRow() - 1, 1).getValues();
  let rowNum = -1;
  for (let i = 0; i < badgeValues.length; i++) {
    const b = String(badgeValues[i][0] || '').trim().replace(/\.0+$/, '').replace(/^0+([0-9]+)$/, '$1');
    if (b === badgeNorm) { rowNum = i + 2; break; }
  }

  if (rowNum < 0) return; // Employee not in EMPLOYEES sheet — skip

  empSheet.getRange(rowNum, colNum).setValue(cellVal);
  Logger.log('Hygiene column updated: Badge=' + badgeNorm + ' | Zone=' + zone + ' | NC=' + ncCount);
}

// ============================================================
// DEBUG
// ============================================================
function debugHygieneHistory() {
  const badge = '1001'; // ← CHANGER ICI

  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('PRP_HYGIENE');

  if (!sheet) { Logger.log('❌ Feuille PRP_HYGIENE introuvable'); return; }

  const lastRow = sheet.getLastRow();
  Logger.log('✅ Feuille trouvée — lastRow: ' + lastRow);
  if (lastRow <= 1) { Logger.log('❌ Feuille vide (seulement les en-têtes)'); return; }

  const realHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  Logger.log('📋 En-têtes réels: ' + JSON.stringify(realHeaders));

  const rows = sheet.getRange(2, 1, Math.min(5, lastRow - 1), sheet.getLastColumn()).getValues();
  rows.forEach((row, i) => {
    const badgeCol = realHeaders.indexOf('EMP_BADGE');
    const idCol    = realHeaders.indexOf('CHECKLIST_ID');
    Logger.log('Ligne ' + (i+2) + ' | CHECKLIST_ID: "' + row[idCol] + '" | EMP_BADGE: "' + row[badgeCol] + '"');
  });

  const norm   = b => String(b || '').trim().replace(/\.0+$/, '').replace(/^0+([0-9]+)$/, '$1');
  const target = norm(badge);
  Logger.log('🔍 Recherche badge normalisé: "' + target + '"');

  let found = 0;
  rows.forEach((row, i) => {
    const badgeCol   = realHeaders.indexOf('EMP_BADGE');
    const raw        = row[badgeCol];
    const normalized = norm(raw);
    const match      = normalized === target;
    if (match) found++;
    Logger.log('  Ligne ' + (i+2) + ': raw="' + raw + '" norm="' + normalized + '" match=' + match);
  });
  Logger.log('✅ Résultat: ' + found + ' ligne(s) trouvée(s) pour badge ' + target);
}

function testHygieneHistory() {
  Logger.log('=== Test getEmployeeHygieneHistory ===');
  Logger.log(JSON.stringify(getEmployeeHygieneHistory('1001')));
}

// ============================================================
// PRP CRITERIA MANAGER
// ============================================================
function getPrpCriteriaHeaders() {
  return ['ID','ICON','NAME_FR','NAME_AR','DESCRIPTION','SORT_ORDER','STATUS','CREATED_AT','UPDATED_AT'];
}

function _prpCriteriaSheet_() {
  const ss = getSpreadsheet();
  let sh = ss.getSheetByName(SHEETS.PRP_CRITERIA);
  if (!sh) {
    sh = ss.insertSheet(SHEETS.PRP_CRITERIA);
    sh.getRange(1,1,1,9).setValues([getPrpCriteriaHeaders()]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function _prpCriteriaRowToObj_(row) {
  return {
    id:          String(row[0] || ''),
    icon:        String(row[1] || '✅'),
    name:        String(row[2] || ''),
    nameAr:      String(row[3] || ''),
    description: String(row[4] || ''),
    sortOrder:   Number(row[5] || 0),
    status:      String(row[6] || 'active'),
    createdAt:   row[7] || '',
    updatedAt:   row[8] || ''
  };
}

function _prpCriteriaSeedDefaults_(sh) {
  const now = new Date();
  const defaults = [
    ['tenue',   '👔', 'Charlotte & Tenue Réglementaire',  'قبعة الشعر والزي المهني',           'Port correct de la charlotte, tenue de travail conforme'],
    ['propre',  '🧺', 'Tenues propres',                    'الملابس نظيفة',                      'Les tenues sont propres, sans souillures visibles'],
    ['bijoux',  '💍', 'Absence de bijoux',                 'عدم ارتداء المجوهرات',               'Pas de bagues, bracelets, montres, boucles d\'oreilles'],
    ['mains',   '🙌', 'Mains propres',                     'اليدان نظيفتان',                     'Mains visiblement propres, sans traces de produits'],
    ['plaies',  '🩹', 'Absence de plaies non protégées',  'عدم وجود جروح مكشوفة',              'Pas de coupures exposées — pansements colorés obligatoires'],
    ['ongles',  '💅', 'Ongles courts et propres',         'أظافر قصيرة ونظيفة',                'Ongles coupés court, pas de vernis, pas de faux ongles'],
    ['gants',   '🧤', 'Port de gants (si requis)',        'ارتداء القفازات عند الاقتضاء',      'Gants adaptés, intégrité vérifiée'],
    ['hygiene', '🚿', 'Comportement hygiénique respecté', 'السلوك الصحي مراعى',                'Pas de touching visage, pas de manger/boire en zone'],
  ];
  const rows = defaults.map((d, i) => [d[0], d[1], d[2], d[3], d[4], i + 1, 'active', now, now]);
  sh.getRange(2, 1, rows.length, 9).setValues(rows);
  return rows;
}

function getPrpCriteria() {
  try {
    const sh = _prpCriteriaSheet_();
    let last = sh.getLastRow();
    if (last < 2) {
      _prpCriteriaSeedDefaults_(sh);
      last = sh.getLastRow();
    }
    const vals = sh.getRange(2,1,last-1,9).getValues();
    const data = vals
      .filter(r => r[0])
      .map(_prpCriteriaRowToObj_)
      .sort((a,b) => (a.sortOrder||0) - (b.sortOrder||0));
    return { success:true, data: data };
  } catch (err) {
    return { success:false, message: String(err && err.message || err) };
  }
}

function savePrpCriterion(payload) {
  try {
    const p    = payload || {};
    const data = p.data || p;
    const user = p.userEmail || 'ADMIN';
    if (!data.name) return { success:false, message:'Nom français requis.' };

    const sh   = _prpCriteriaSheet_();
    const last = sh.getLastRow();
    const rows = last > 1 ? sh.getRange(2,1,last-1,9).getValues() : [];
    const now  = new Date();

    let id = data.id;
    let rowIndex = -1;
    if (id) rowIndex = rows.findIndex(r => String(r[0]) === String(id));

    const newRow = [
      id || ('CRIT-' + Utilities.getUuid().slice(0,8).toUpperCase()),
      data.icon || '✅',
      data.name || '',
      data.nameAr || '',
      data.description || '',
      Number(data.sortOrder || 0),
      data.status || 'active',
      rowIndex >= 0 ? (rows[rowIndex][7] || now) : now,
      now
    ];

    if (rowIndex >= 0) sh.getRange(rowIndex + 2, 1, 1, 9).setValues([newRow]);
    else sh.appendRow(newRow);

    _prpAudit_('SAVE_PRP_CRITERION', newRow[0], user);
    return { success:true, id:newRow[0] };
  } catch (err) {
    return { success:false, message: String(err && err.message || err) };
  }
}

function deletePrpCriterion(payload) {
  try {
    const id   = (payload && payload.id) || payload;
    const user = (payload && payload.userEmail) || 'ADMIN';
    if (!id) return { success:false, message:'ID requis.' };
    const sh   = _prpCriteriaSheet_();
    const last = sh.getLastRow();
    if (last < 2) return { success:false, message:'Vide.' };
    const ids = sh.getRange(2,1,last-1,1).getValues();
    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(id)) {
        sh.deleteRow(i + 2);
        _prpAudit_('DELETE_PRP_CRITERION', id, user);
        return { success:true };
      }
    }
    return { success:false, message:'Introuvable.' };
  } catch (err) {
    return { success:false, message: String(err && err.message || err) };
  }
}

function _prpAudit_(action, entityId, user) {
  try {
    const ss = getSpreadsheet();
    const sh = ss.getSheetByName(SHEETS.AUDIT_LOGS);
    if (sh) sh.appendRow([new Date(), action, entityId, user, '', user]);
  } catch(e){}
}


// ============================================================
// ─── PLAN DE FORMATION v6.0 (added by patch) ────────────────
// ============================================================

function getFormationSessionHeaders() {
  return [
    'SESSION_ID', 'DATE', 'THEME', 'TRAINER', 'LOCATION',
    'TIME_START', 'TIME_END', 'PARTICIPANTS', 'PARTICIPANT_COUNT',
    'STATUS', 'NOTES', 'GENERATED', 'YEAR', 'CREATED_BY', 'CREATED_AT',
    'PHOTO_URL'   // ← colonne 16 (index 15) — nouveau
  ];
}

function getFormationPlanHeaders() {
  return [
    'PLAN_ID', 'YEAR', 'GENERATED_AT', 'SESSION_COUNT',
    'EMP_COUNT', 'THEMES', 'GENERATED_BY'
  ];
}

function getFormationData(year) {
  try {
    const targetYear = year || new Date().getFullYear();
    const sessionsRes = getFormationSessions(targetYear);
    const sessions    = sessionsRes.success ? sessionsRes.data : [];

    const ss       = getSpreadsheet();
    const empSheet = ss.getSheetByName(SHEETS.EMPLOYEES);
    const employees = [];

    if (empSheet && empSheet.getLastRow() > 1) {
      const empData    = empSheet.getDataRange().getValues();
      const empHeaders = empData[0].map(h => String(h).trim());
      const BASE_COLS  = 3;
      const themeColNames = empHeaders.slice(BASE_COLS).filter(h => h && !h.startsWith('QUIZ:') && !h.startsWith('HYGIENE:'));

      for (let r = 1; r < empData.length; r++) {
        const badge = String(empData[r][0] || '').trim().replace(/\.0+$/, '');
        const name  = String(empData[r][1] || '').trim();
        const dept  = String(empData[r][2] || '').trim();
        if (!badge || !name) continue;

        const sensibilisedThemes = [];
        themeColNames.forEach((theme, idx) => {
          const cellVal = String(empData[r][BASE_COLS + idx] || '').trim();
          if (cellVal && cellVal.toLowerCase().startsWith('sensibil')) {
            sensibilisedThemes.push(theme);
          }
        });
        employees.push({ badge, name, dept, sensibilisedThemes });
      }
    }

    const alerts = _buildFormationAlerts_(sessions, employees, targetYear);
    return { success: true, sessions, employees, alerts };
  } catch (err) {
    Logger.log('getFormationData error: ' + err);
    return { success: false, message: err.message, sessions: [], employees: [], alerts: [] };
  }
}

function getFormationSessions(year) {
  try {
    const ss    = getSpreadsheet();
    const sheet = ss.getSheetByName(SHEETS.FORMATION_SESSIONS);
    if (!sheet || sheet.getLastRow() <= 1) return { success: true, data: [] };

    const headers = getFormationSessionHeaders();
    const values  = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();

    let sessions = values
      .filter(row => row[0])
      .map(row => {
        const obj = {};
        headers.forEach((h, i) => { obj[h] = row[i]; });
        const rawDate = obj['DATE'];
        let dateStr = '';
        if (rawDate instanceof Date && !isNaN(rawDate)) dateStr = rawDate.toISOString().slice(0, 10);
        else if (rawDate) dateStr = String(rawDate).slice(0, 10);
        obj.date         = dateStr;
        obj.id           = String(obj['SESSION_ID'] || '').trim();
        obj.theme        = String(obj['THEME']       || '').trim();
        obj.trainer      = String(obj['TRAINER']     || '').trim();
        obj.location     = String(obj['LOCATION']    || '').trim();
        obj.status       = String(obj['STATUS']      || 'planned').trim().toLowerCase();
        obj.notes        = String(obj['NOTES']        || '').trim();
        obj.participants = _parseParticipants_(obj['PARTICIPANTS']);
        obj.generated    = obj['GENERATED'] === true || obj['GENERATED'] === 'true';
        return obj;
      });

    if (year) sessions = sessions.filter(s => s.date && s.date.startsWith(String(year)));
    sessions.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    return { success: true, data: sessions };
  } catch (err) {
    Logger.log('getFormationSessions error: ' + err);
    return { success: false, message: err.message, data: [] };
  }
}

function addFormationSession(session, createdBy) {
  try {
    if (!session) return { success: false, message: 'Données de session manquantes.' };
    if (!session.theme || !session.date)
      return { success: false, message: 'Le thème et la date sont obligatoires.' };

    const ss = getSpreadsheet();
    let sheet = ss.getSheetByName(SHEETS.FORMATION_SESSIONS);
    if (!sheet)
      sheet = createSheetIfNotExists(ss, SHEETS.FORMATION_SESSIONS, getFormationSessionHeaders());

    // ── S'assurer que la colonne PHOTO_URL existe ──
    var lastCol     = sheet.getLastColumn();
    var sheetHeader = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) {
      return String(h).trim();
    });
    if (sheetHeader.indexOf('PHOTO_URL') === -1) {
      var newCol = lastCol + 1;
      sheet.getRange(1, newCol).setValue('PHOTO_URL')
        .setBackground('#1a3c5e').setFontColor('#ffffff').setFontWeight('bold');
    }

    const sessionId = session.id ||
      ('FS-' + Utilities.getUuid().replace(/-/g, '').slice(0, 12).toUpperCase());

    let dateVal = session.date;
    if (typeof dateVal === 'string' && dateVal.match(/^\d{4}-\d{2}-\d{2}$/))
      dateVal = new Date(dateVal + 'T00:00:00');

    const year         = dateVal instanceof Date
      ? dateVal.getFullYear()
      : new Date(session.date).getFullYear();
    const participants = Array.isArray(session.participants)
      ? session.participants.join(', ')
      : (session.participants || '');
    const partCount    = Array.isArray(session.participants)
      ? session.participants.length
      : 0;

    let status = session.status || 'planned';
    if (!session.status) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const sDate = new Date(session.date); sDate.setHours(0, 0, 0, 0);
      if (sDate < today) status = 'overdue';
    }

    var photoUrl = String(session.photoUrl || '').trim();

    sheet.appendRow([
      sessionId,
      dateVal,
      session.theme,
      session.trainer  || '',
      session.location || 'Salle de formation',
      session.timeStart || '',
      session.timeEnd   || '',
      participants,
      partCount,
      status,
      session.notes || '',
      session.generated ? 'true' : 'false',
      year,
      createdBy || 'PLAN',
      new Date(),
      photoUrl          // ← colonne PHOTO_URL
    ]);

    sheet.getRange(sheet.getLastRow(), 2).setNumberFormat('dd/mm/yyyy');

    Logger.log('addFormationSession: ' + sessionId + ' | photoUrl="' + photoUrl + '"');

    try {
      logAudit('FORMATION_SESSION_ADDED', sessionId, createdBy || 'PLAN',
        session.theme + ' | ' + session.date + ' | ' + partCount + ' participants' +
        (photoUrl ? ' | Photo: ' + photoUrl : ''));
    } catch(e) {}

    return { success: true, sessionId, message: 'Session planifiée: ' + sessionId };
  } catch(err) {
    Logger.log('addFormationSession error: ' + err);
    return { success: false, message: err.message };
  }
}

/**
 * v7.4 — BATCHED saveGeneratedPlan
 * Avoids Apps Script 6-minute timeout when persisting site-wide annual plans
 * by writing rows in one single setValues() call per chunk rather than
 * calling addFormationSession() (which uses appendRow + multiple sheet I/Os).
 */
function saveGeneratedPlan(plan, year) {
  try {
    if (!plan || !plan.length) return { success: false, message: 'Plan vide.' };
    var ss     = getSpreadsheet();
    var sheet  = ss.getSheetByName(SHEETS.FORMATION_SESSIONS);
    if (!sheet) sheet = createSheetIfNotExists(ss, SHEETS.FORMATION_SESSIONS, getFormationSessionHeaders());
    var headers   = getFormationSessionHeaders();
    var col       = function(name){ return headers.indexOf(name); };
    var iId       = col('ID');
    var iTheme    = col('THEME');
    var iDate     = col('DATE');
    var iTrainer  = col('TRAINER');
    var iLocation = col('LOCATION');
    var iStatus   = col('STATUS');
    var iNotes    = col('NOTES');
    var iParts    = col('PARTICIPANTS');
    var iPartsCnt = col('PARTICIPANT_COUNT');
    var iCreated  = col('CREATED_AT');

    var width  = headers.length;
    var rows   = [];
    var now    = new Date();
    var errors = [];

    plan.forEach(function(session, idx){
      try {
        if (!session || !session.theme) { errors.push('Session '+idx+': thème manquant'); return; }
        var row = new Array(width).fill('');
        if (iId>=0)       row[iId]       = 'FS-' + Date.now() + '-' + Math.floor(Math.random()*9999);
        if (iTheme>=0)    row[iTheme]    = String(session.theme||'').trim();
        if (iDate>=0)     row[iDate]     = session.date ? new Date(session.date + 'T00:00:00') : new Date();
        if (iTrainer>=0)  row[iTrainer]  = String(session.trainer||'').trim();
        if (iLocation>=0) row[iLocation] = String(session.location||'').trim();
        if (iStatus>=0)   row[iStatus]   = String(session.status||'planifié').trim();
        if (iNotes>=0)    row[iNotes]    = String(session.notes||'').trim();
        if (iParts>=0) {
          var parts = Array.isArray(session.participants) ? session.participants.join(', ') : (session.participants||'');
          row[iParts] = parts;
          if (iPartsCnt>=0) row[iPartsCnt] = parts ? parts.split(',').length : 0;
        }
        if (iCreated>=0)  row[iCreated]  = now;
        rows.push(row);
      } catch(e){ errors.push('Session '+idx+': '+e.message); }
    });

    if (!rows.length) {
      return { success:false, message:'Aucune session valide à enregistrer.', errors:errors };
    }

    // Batched write — 200 rows per chunk to stay well under quotas
    var CHUNK = 200;
    var startRow = sheet.getLastRow() + 1;
    var written = 0;
    for (var i = 0; i < rows.length; i += CHUNK) {
      var slice = rows.slice(i, i + CHUNK);
      sheet.getRange(startRow + i, 1, slice.length, width).setValues(slice);
      written += slice.length;
      SpreadsheetApp.flush();
    }
    if (iDate>=0) sheet.getRange(startRow, iDate+1, rows.length, 1).setNumberFormat('dd/mm/yyyy');
    if (iCreated>=0) sheet.getRange(startRow, iCreated+1, rows.length, 1).setNumberFormat('dd/mm/yyyy hh:mm');

    // Log plan summary in FORMATION_PLAN
    try {
      var planSheet = ss.getSheetByName(SHEETS.FORMATION_PLAN);
      if (!planSheet) planSheet = createSheetIfNotExists(ss, SHEETS.FORMATION_PLAN, getFormationPlanHeaders());
      var themes = Array.from(new Set(plan.map(function(s){return s.theme;}))).join(', ');
      planSheet.appendRow(['PLAN-' + Date.now(), year || new Date().getFullYear(), new Date(), plan.length, 0, themes, 'GENERATOR']);
      planSheet.getRange(planSheet.getLastRow(), 3).setNumberFormat('dd/mm/yyyy hh:mm');
    } catch(e) { Logger.log('saveGeneratedPlan plan log: ' + e); }

    try { logAudit('FORMATION_PLAN_BATCH_SAVED', String(year||''), 'GENERATOR', written+' rows'); } catch(_){}

    return {
      success: true,
      added:   written,
      errors:  errors,
      message: written + ' session(s) enregistrée(s) (lot optimisé) sur ' + plan.length + '.'
    };
  } catch (err) {
    Logger.log('saveGeneratedPlan error: ' + err);
    return { success: false, message: err.message };
  }
}

function updateFormationSession(session, userEmail) {
  try {
    if (!session || !session.id) return { success: false, message: '`session.id` requis.' };
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(SHEETS.FORMATION_SESSIONS);
    if (!sheet || sheet.getLastRow() <= 1) return { success: false, message: 'Aucune session trouvée.' };
    const headers = getFormationSessionHeaders();
    const values = sheet.getDataRange().getValues();
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][0]).trim() !== String(session.id).trim()) continue;
      const rowNum = i + 1;
      const col = name => headers.indexOf(name) + 1;
      if (session.theme)    sheet.getRange(rowNum, col('THEME')).setValue(session.theme);
      if (session.date)     sheet.getRange(rowNum, col('DATE')).setValue(new Date(session.date + 'T00:00:00'));
      if (session.trainer)  sheet.getRange(rowNum, col('TRAINER')).setValue(session.trainer);
      if (session.location) sheet.getRange(rowNum, col('LOCATION')).setValue(session.location);
      if (session.status)   sheet.getRange(rowNum, col('STATUS')).setValue(session.status);
      if (session.notes !== undefined) sheet.getRange(rowNum, col('NOTES')).setValue(session.notes || '');
      if (session.participants) {
        const parts = Array.isArray(session.participants) ? session.participants.join(', ') : session.participants;
        sheet.getRange(rowNum, col('PARTICIPANTS')).setValue(parts);
        sheet.getRange(rowNum, col('PARTICIPANT_COUNT')).setValue(
          Array.isArray(session.participants) ? session.participants.length : parts.split(',').length);
      }
      try { logAudit('FORMATION_SESSION_UPDATED', session.id, userEmail || 'PLAN', 'Status: ' + (session.status || '—')); } catch(e) {}
      return { success: true, message: 'Session mise à jour.' };
    }
    return { success: false, message: 'Session introuvable: ' + session.id };
  } catch (err) {
    Logger.log('updateFormationSession error: ' + err);
    return { success: false, message: err.message };
  }
}

function deleteFormationSession(sessionId, userEmail) {
  try {
    if (!sessionId) return { success: false, message: '`sessionId` requis.' };
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(SHEETS.FORMATION_SESSIONS);
    if (!sheet || sheet.getLastRow() <= 1) return { success: false, message: 'Aucune session trouvée.' };
    const headers = getFormationSessionHeaders();
    const values = sheet.getDataRange().getValues();
    const stCol  = headers.indexOf('STATUS') + 1;
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][0]).trim() !== String(sessionId).trim()) continue;
      sheet.getRange(i + 1, stCol).setValue('deleted');
      try { logAudit('FORMATION_SESSION_DELETED', sessionId, userEmail || 'PLAN', ''); } catch(e) {}
      return { success: true, message: 'Session supprimée.' };
    }
    return { success: false, message: 'Session introuvable: ' + sessionId };
  } catch (err) {
    Logger.log('deleteFormationSession error: ' + err);
    return { success: false, message: err.message };
  }
}

function _parseParticipants_(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  return String(raw).split(',').map(p => p.trim()).filter(Boolean);
}

function _buildFormationAlerts_(sessions, employees, year) {
  const alerts = [];
  const now    = new Date();
  const noTraining = employees.filter(e => !(e.sensibilisedThemes || []).length);
  if (noTraining.length) alerts.push({ type:'orange', icon:'⚠️', title: noTraining.length + ' employé(s) sans aucune formation', sub:'Formation initiale FSSC 22000 requise', due:'Urgent' });
  const yearSessions = sessions.filter(s => s.date && s.date.startsWith(String(year)));
  if (!yearSessions.length) alerts.push({ type:'red', icon:'📅', title:'Aucune session planifiée pour ' + year, sub:'Créez le plan annuel via le générateur', due:'Urgent' });
  const overdue = sessions.filter(s => { if (s.status === 'done' || s.status === 'deleted') return false; return s.date && new Date(s.date) < now; });
  if (overdue.length) alerts.push({ type:'red', icon:'❌', title: overdue.length + ' session(s) en retard', sub:'Sessions planifiées non réalisées', due:'Urgent' });
  const soon = yearSessions.filter(s => { if (s.status === 'done' || s.status === 'deleted') return false; const d = new Date(s.date); const diff = (d - now)/86400000; return diff >= 0 && diff <= 7; });
  if (soon.length) alerts.push({ type:'blue', icon:'📆', title: soon.length + ' session(s) dans les 7 prochains jours', sub: soon.map(s => s.theme).join(', '), due:'À venir' });
  if (yearSessions.length) {
    const done = yearSessions.filter(s => s.status === 'done').length;
    alerts.push({ type:'green', icon:'✅', title:'Plan ' + year + ' en cours — ' + done + '/' + yearSessions.length + ' réalisées', sub: yearSessions.length + ' session(s) enregistrée(s) pour ' + year, due:'OK' });
  }
  return alerts;
}

// ============================================================
// PLAN DE FORMATION — DASHBOARD KPIs (admin dashboard cards)
// ============================================================
/**
 * Returns the three Plan-de-Formation KPIs for the admin dashboard:
 *   - trp:     Taux de Réalisation du Plan (% sessions done / planned-to-date)
 *   - eff:     Taux d'Efficacité Terrain à J+30 (% rows Conforme)
 *   - alerts:  Number of employees overdue for recycling
 * Each KPI also returns a `level` ∈ { green | orange | red } based on thresholds.
 */
function getFormationKPIs() {
  try {
    const ss  = getSpreadsheet();
    const now = new Date(); now.setHours(0,0,0,0);

    // ── KPI 1: Taux de Réalisation du Plan ─────────────────
    let trpDone = 0, trpPlanned = 0;
    const sSheet = ss.getSheetByName(SHEETS.FORMATION_SESSIONS);
    if (sSheet && sSheet.getLastRow() > 1) {
      const headers = getFormationSessionHeaders();
      const dateIdx = headers.indexOf('DATE');
      const stIdx   = headers.indexOf('STATUS');
      const rows = sSheet.getRange(2, 1, sSheet.getLastRow()-1, headers.length).getValues();
      rows.forEach(r => {
        if (!r[0]) return;
        const status = String(r[stIdx] || '').trim().toLowerCase();
        if (status === 'deleted') return;
        const d = r[dateIdx] instanceof Date ? r[dateIdx] : (r[dateIdx] ? new Date(r[dateIdx]) : null);
        if (!d || isNaN(d)) return;
        if (d <= now) {
          trpPlanned++;
          if (status === 'done') trpDone++;
        }
      });
    }
    const trpPct = trpPlanned ? Math.round((trpDone / trpPlanned) * 1000) / 10 : 0;
    const trpLvl = trpPct >= 95 ? 'green' : (trpPct >= 80 ? 'orange' : 'red');

    // ── KPI 2: Taux d'Efficacité Terrain à J+30 ────────────
    // Searches any sheet that exposes a column 'Efficacite_A_Froid_J30'.
    let effOk = 0, effTotal = 0;
    const candidateSheets = [
      SHEETS.FORMATION_SESSIONS,
      SHEETS.QUIZ_RESPONSES,
      SHEETS.EMPLOYEES,
      SHEETS.SENSIBILISATION_MANUAL
    ];
    candidateSheets.forEach(name => {
      const sh = ss.getSheetByName(name);
      if (!sh || sh.getLastRow() <= 1) return;
      const data = sh.getDataRange().getValues();
      const hdr  = data[0].map(h => String(h).trim());
      const idx  = hdr.indexOf('Efficacite_A_Froid_J30');
      if (idx === -1) return;
      for (let i = 1; i < data.length; i++) {
        const v = String(data[i][idx] || '').trim();
        if (!v) continue;
        effTotal++;
        if (v.toLowerCase() === 'conforme') effOk++;
      }
    });
    const effPct = effTotal ? Math.round((effOk / effTotal) * 1000) / 10 : 0;
    const effLvl = effPct >= 85 ? 'green' : 'red';

    // ── KPI 3: Alertes Recyclage ───────────────────────────
    // Count employees whose Date_Realisee + Frequence_Mois (months) is past today.
    let recAlerts = 0;
    const empSh = ss.getSheetByName(SHEETS.EMPLOYEES);
    if (empSh && empSh.getLastRow() > 1) {
      const data = empSh.getDataRange().getValues();
      const hdr  = data[0].map(h => String(h).trim());
      const dIdx = hdr.indexOf('Date_Realisee');
      const fIdx = hdr.indexOf('Frequence_Mois');
      if (dIdx !== -1 && fIdx !== -1) {
        for (let i = 1; i < data.length; i++) {
          const d = data[i][dIdx] instanceof Date ? data[i][dIdx] : (data[i][dIdx] ? new Date(data[i][dIdx]) : null);
          const f = Number(data[i][fIdx]);
          if (!d || isNaN(d) || !f) continue;
          const expiry = new Date(d.getTime());
          expiry.setMonth(expiry.getMonth() + f);
          if (expiry < now) recAlerts++;
        }
      }
    }
    const recLvl = recAlerts > 0 ? 'red' : 'green';

    return {
      success: true,
      data: {
        trp:    { value: trpPct, done: trpDone, planned: trpPlanned, level: trpLvl },
        eff:    { value: effPct, ok: effOk, total: effTotal,         level: effLvl },
        alerts: { value: recAlerts,                                  level: recLvl }
      }
    };
  } catch (err) {
    Logger.log('getFormationKPIs error: ' + err);
    return { success: false, message: err.message,
      data: { trp:{value:0,done:0,planned:0,level:'red'}, eff:{value:0,ok:0,total:0,level:'red'}, alerts:{value:0,level:'green'} } };
  }
}

function debugFormationData() {
  Logger.log('=== Formation Data Debug ===');
  Logger.log('getFormationData(2026): '  + JSON.stringify(getFormationData(2026)));
  Logger.log('getFormationSessions(): '  + JSON.stringify(getFormationSessions()));
  Logger.log('getFormationKPIs(): '      + JSON.stringify(getFormationKPIs()));
}


// ============================================================
// v6.0 — SENSIBILISATION ↔ FORMATION_SESSIONS BRIDGE + KPI SYNC
// ============================================================
function _bridgeSensibilisationToFormationSession_(payload) {
  try {
    // ── Construire les notes avec photoUrl bien séparé ──
    var notesParts = ['Auto-sync depuis Sensibilisation'];
    var photoUrl   = String(payload.evidenceUrl || '').trim();
    if (photoUrl) notesParts.push('Photo: ' + photoUrl);

    Logger.log('_bridge evidenceUrl: "' + photoUrl + '"');

    var session = {
      theme:        payload.theme,
      date:         payload.dateVal,
      trainer:      payload.animateur,
      location:     payload.location || 'Sensibilisation terrain',
      participants: (payload.badgeList || []).concat(
                      (payload.manualEntries || []).map(function(e) {
                        return e.badge || e.name;
                      })
                    ),
      status:       'done',
      notes:        notesParts.join(' | '),
      generated:    false,
      photoUrl:     photoUrl   // ← stocker aussi dans un champ dédié si la colonne existe
    };

    var r = addFormationSession(session, 'SENSIBILISATION');
    Logger.log('_bridge result: ' + JSON.stringify(r));
    return r && r.sessionId ? r.sessionId : null;
  } catch(e) {
    Logger.log('_bridgeSensibilisationToFormationSession_ error: ' + e);
    return null;
  }
}

function getSensibilisationSessionDetail(sessionId) {
  try {
    if (!sessionId) return { success: false, message: 'sessionId requis.' };
    const ss = getSpreadsheet();
    const sh = ss.getSheetByName(SHEETS.FORMATION_SESSIONS);
    if (!sh || sh.getLastRow() <= 1) return { success: false, message: 'Aucune session.' };

    // Lire les headers RÉELS de la feuille (pas le tableau statique)
    const rawHdr  = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    const headers = rawHdr.map(function(h) { return String(h).trim(); });
    const get     = function(name, row) {
      var i = headers.indexOf(name);
      return i >= 0 ? row[i] : '';
    };

    const vals = sh.getRange(2, 1, sh.getLastRow() - 1, headers.length).getValues();
    for (let i = 0; i < vals.length; i++) {
      const row = vals[i];
      if (String(get('SESSION_ID', row)).trim() !== String(sessionId).trim()) continue;

      const parts = String(get('PARTICIPANTS', row) || '')
        .split(',').map(function(s) { return s.trim(); }).filter(Boolean);
      const depts = _resolveBadgeDepartments_(parts);

      // photoUrl : colonne dédiée EN PRIORITÉ
      var photoUrl = String(get('PHOTO_URL', row) || '').trim();
      if (!photoUrl) {
        var notes = String(get('NOTES', row) || '');
        var m = notes.match(/Photo:\s*(https?:\/\/[^\s|]+)/i);
        if (m) photoUrl = m[1].trim();
      }

      Logger.log('getSensibilisationSessionDetail: id=' + sessionId + ' photoUrl="' + photoUrl + '"');

      return {
        success: true,
        data: {
          id:           String(get('SESSION_ID',  row)).trim(),
          date:         String(get('DATE',        row)).trim(),
          theme:        String(get('THEME',       row)).trim(),
          trainer:      String(get('TRAINER',     row)).trim(),
          location:     String(get('LOCATION',    row)).trim(),
          headcount:    parts.length,
          participants: parts,
          departments:  depts,
          status:       String(get('STATUS',      row)).trim(),
          photoUrl:     photoUrl,
          notes:        String(get('NOTES',       row)).trim()
        }
      };
    }
    return { success: false, message: 'Session introuvable: ' + sessionId };
  } catch(err) {
    Logger.log('getSensibilisationSessionDetail error: ' + err);
    return { success: false, message: err.message };
  }
}

function _resolveBadgeDepartments_(badges) {
  try {
    if (!badges || !badges.length) return [];
    const ss = getSpreadsheet();
    const sh = ss.getSheetByName(SHEETS.EMPLOYEES);
    if (!sh || sh.getLastRow() <= 1) return [];
    const data = sh.getRange(2, 1, sh.getLastRow()-1, 3).getValues();
    const map = {};
    data.forEach(r => { const b = String(r[0]||'').trim(); if (b) map[b] = String(r[2]||'').trim(); });
    const out = new Set();
    badges.forEach(b => { const d = map[String(b).trim()]; if (d) out.add(d); });
    return [...out];
  } catch (e) { return []; }
}

// ── Nightly recyclage check ─────────────────────────────────
function installRecyclageDailyTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'dailyRecyclageCheck') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('dailyRecyclageCheck').timeBased().atHour(6).everyDays(1).create();
  return { success:true, message:'Trigger installé (06:00 quotidien).' };
}

function dailyRecyclageCheck() {
  try {
    const kpi = getFormationKPIs();
    const n = kpi && kpi.data && kpi.data.alerts ? kpi.data.alerts.value : 0;
    try { logAudit('RECYCLAGE_DAILY_CHECK', 'EMPLOYEES', 'SYSTEM',
                   n + ' employé(s) avec formation expirée.'); } catch (e) {}
    return n;
  } catch (e) {
    Logger.log('dailyRecyclageCheck error: ' + e);
    return -1;
  }
}

// ============================================================
// HISTORICAL CALENDAR LOADER — Sensibilisation past sessions
// Returns every existing row of FORMATION_SESSIONS as
// lightweight calendar objects consumed by platform.html.
// Used at boot via:
//   google.script.run
//     .withSuccessHandler(cb)
//     .getPastSensibilisationSessions();
function getPastSensibilisationSessions() {
  try {
    const ss    = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.FORMATION_SESSIONS);
    if (!sheet || sheet.getLastRow() <= 1) return [];

    const tz      = Session.getScriptTimeZone() || 'Europe/Paris';
    const rawHdr  = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const headers = rawHdr.map(function(h) { return String(h).trim(); });
    const idx     = function(name) { return headers.indexOf(name); };

    const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();

    const out = [];
    rows.forEach(function(row) {
      const id = String(row[idx('SESSION_ID')] || '').trim();
      if (!id) return;

      const status = String(row[idx('STATUS')] || '').trim().toLowerCase();
      if (status === 'deleted') return;

      const rawDate = row[idx('DATE')];
      let dateStr = '';
      if (rawDate instanceof Date && !isNaN(rawDate)) {
        dateStr = Utilities.formatDate(rawDate, tz, 'yyyy-MM-dd');
      } else if (rawDate) {
        dateStr = String(rawDate).slice(0, 10);
      }
      if (!dateStr) return;

      const badges = String(row[idx('PARTICIPANTS')] || '')
        .split(',').map(function(s) { return s.trim(); }).filter(Boolean);

      let depts = [];
      try { depts = _resolveBadgeDepartments_(badges); } catch(e) {}

      // ── photoUrl : colonne dédiée EN PRIORITÉ, fallback regex dans NOTES ──
      var photoUrl = '';
      var photoColIdx = idx('PHOTO_URL');
      if (photoColIdx >= 0 && row[photoColIdx]) {
        photoUrl = String(row[photoColIdx]).trim();
      }
      if (!photoUrl) {
        var notes = String(row[idx('NOTES')] || '');
        var m = notes.match(/Photo:\s*(https?:\/\/[^\s|]+)/i);
        if (m) photoUrl = m[1].trim();
      }

      out.push({
        id:           id,
        theme:        String(row[idx('THEME')]    || '').trim(),
        trainer:      String(row[idx('TRAINER')]  || '').trim(),
        date:         dateStr,
        headcount:    badges.length,
        participants: badges,
        location:     String(row[idx('LOCATION')] || 'Usine').trim() || 'Usine',
        departments:  depts,
        photoUrl:     photoUrl,
        status:       status || 'done',
        _source:      'formation'
      });
    });

    out.sort(function(a, b) { return (b.date || '').localeCompare(a.date || ''); });
    return out;
  } catch(err) {
    Logger.log('getPastSensibilisationSessions error: ' + err);
    return [];
  }
}
function getAllEmployees() {
  try {
    const ss    = getSpreadsheet();
    const sheet = ss.getSheetByName(SHEETS.EMPLOYEES);
    if (!sheet || sheet.getLastRow() <= 1)
      return { success: true, employees: [] };

    const data    = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h).trim());
    const BASE_COLS = 3; // BADGE, FULL_NAME, DEPARTMENT

    // Collect all theme column names (exclude QUIZ: and HYGIENE: columns)
    const themeColNames = headers.slice(BASE_COLS).filter(h =>
      h && !h.startsWith('QUIZ:') && !h.startsWith('HYGIENE:')
    );

    const employees = [];
    for (let r = 1; r < data.length; r++) {
      const badge = String(data[r][0] || '').trim().replace(/\.0+$/, '');
      const name  = String(data[r][1] || '').trim();
      const dept  = String(data[r][2] || '').trim();
      if (!badge || !name) continue;

      const sensibilisedThemes = [];
      themeColNames.forEach((theme, idx) => {
        const cellVal = String(data[r][BASE_COLS + idx] || '').trim();
        if (cellVal && cellVal.toLowerCase().startsWith('sensibil')) {
          sensibilisedThemes.push(theme);
        }
      });

      employees.push({
        badge,
        name,
        dept,
        sensibilisedThemes,
        totalThemes: themeColNames.length,
      });
    }

    return {
      success:     true,
      employees,
      totalThemes: themeColNames.length,
      themes:      themeColNames,
    };
  } catch (err) {
    Logger.log('getAllEmployees error: ' + err);
    return { success: false, message: err.message, employees: [] };
  }
}
function migratePhotoUrlColumn() {
  var ss    = SpreadsheetApp.openById('1YaS8SxEKJVoi-j9DiCP7epNlznk2_sO4OPMwk6sRkdQ');
  var sheet = ss.getSheetByName('FORMATION_SESSIONS');
  if (!sheet) { Logger.log('Sheet not found'); return; }

  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) {
    return String(h).trim();
  });

  var photoColIdx = headers.indexOf('PHOTO_URL');
  if (photoColIdx === -1) {
    sheet.getRange(1, lastCol + 1).setValue('PHOTO_URL')
      .setBackground('#1a3c5e').setFontColor('#ffffff').setFontWeight('bold');
    photoColIdx = lastCol;
    lastCol++;
    headers.push('PHOTO_URL');
  }
  var photoColNum = photoColIdx + 1;
  var notesColNum = headers.indexOf('NOTES') + 1;
  if (!notesColNum) { Logger.log('NOTES column not found'); return; }

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) { Logger.log('No data rows'); return; }

  var notesValues = sheet.getRange(2, notesColNum, lastRow - 1, 1).getValues();
  var photoValues = sheet.getRange(2, photoColNum, lastRow - 1, 1).getValues();
  var updates = 0;

  notesValues.forEach(function(row, i) {
    if (photoValues[i][0]) return;
    var notes = String(row[0] || '');
    var m = notes.match(/Photo:\s*(https?:\/\/[^\s|]+)/i);
    if (m) {
      sheet.getRange(i + 2, photoColNum).setValue(m[1].trim());
      updates++;
    }
  });

  Logger.log('✅ Migration done: ' + updates + ' rows updated.');
}
function debugFormationSessions() {
  var ss    = SpreadsheetApp.openById('1YaS8SxEKJVoi-j9DiCP7epNlznk2_sO4OPMwk6sRkdQ');
  var sheet = ss.getSheetByName('FORMATION_SESSIONS');
  if (!sheet) { Logger.log('❌ FORMATION_SESSIONS introuvable'); return; }

  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) {
    return String(h).trim();
  });
  Logger.log('📋 Headers: ' + JSON.stringify(headers));

  var lastRow = sheet.getLastRow();
  Logger.log('📊 Nombre de lignes: ' + (lastRow - 1));

  if (lastRow <= 1) { Logger.log('❌ Feuille vide'); return; }

  var rows = sheet.getRange(2, 1, Math.min(5, lastRow - 1), lastCol).getValues();
  rows.forEach(function(row, i) {
    var obj = {};
    headers.forEach(function(h, j) { obj[h] = String(row[j] || '').slice(0, 80); });
    Logger.log('--- Ligne ' + (i+2) + ' ---');
    Logger.log('SESSION_ID: ' + obj['SESSION_ID']);
    Logger.log('THEME: '      + obj['THEME']);
    Logger.log('STATUS: '     + obj['STATUS']);
    Logger.log('NOTES: '      + obj['NOTES']);
    Logger.log('PHOTO_URL: '  + (obj['PHOTO_URL'] || '(vide)'));
  });
}

// ============================================================
// USER ADMIN — change password / delete (v6 patch)
// ============================================================
function changeUserPassword(userId, newPassword, adminEmail) {
  try {
    if (!userId)              return { success:false, message:'`userId` requis' };
    if (!newPassword || String(newPassword).length < 6)
      return { success:false, message:'Mot de passe trop court (min. 6 caractères)' };
    var sheet = getSpreadsheet().getSheetByName(SHEETS.USERS);
    if (!sheet) return { success:false, message:'Feuille USERS introuvable' };
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(userId)) {
        sheet.getRange(i + 1, 3).setValue(hashPassword(String(newPassword)));
        try {
          var al = getSpreadsheet().getSheetByName(SHEETS.AUDIT_LOGS);
          if (al) al.appendRow([new Date(), 'CHANGE_PASSWORD', userId, adminEmail || 'ADMIN', '', adminEmail || 'ADMIN']);
        } catch(e){}
        return { success:true, message:'Mot de passe mis à jour' };
      }
    }
    return { success:false, message:'Utilisateur introuvable' };
  } catch (err) {
    return { success:false, message: err.message };
  }
}

function deleteUser(userId, adminEmail) {
  try {
    if (!userId) return { success:false, message:'`userId` requis' };
    var sheet = getSpreadsheet().getSheetByName(SHEETS.USERS);
    if (!sheet) return { success:false, message:'Feuille USERS introuvable' };
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(userId)) {
        // Protect last Admin
        if (String(data[i][4]).toLowerCase() === 'admin') {
          var adminCount = 0;
          for (var j = 1; j < data.length; j++) {
            if (String(data[j][4]).toLowerCase() === 'admin' && String(data[j][3]).toLowerCase() === 'active') adminCount++;
          }
          if (adminCount <= 1) return { success:false, message:"Impossible de supprimer le dernier administrateur actif." };
        }
        var username = data[i][1];
        sheet.deleteRow(i + 1);
        try {
          var al = getSpreadsheet().getSheetByName(SHEETS.AUDIT_LOGS);
          if (al) al.appendRow([new Date(), 'DELETE_USER', userId + ' (' + username + ')', adminEmail || 'ADMIN', '', adminEmail || 'ADMIN']);
        } catch(e){}
        return { success:true, message:'Utilisateur supprimé: ' + username };
      }
    }
    return { success:false, message:'Utilisateur introuvable' };
  } catch (err) {
    return { success:false, message: err.message };
  }
}


// ============================================================
// QUIZ TIMER CONFIG — v6.1 additions
// ============================================================
function getQuizTimerConfig() {
  // v6.2 — timer is now mandatory; enabled is always true.
  try {
    var cfg = { enabled:true, seconds:30 };
    var sh = getSpreadsheet().getSheetByName(SHEETS.SETTINGS);
    if (sh && sh.getLastRow() > 1) {
      var d = sh.getDataRange().getValues();
      for (var i=1;i<d.length;i++) {
        var k = String(d[i][0]||'').trim(); var v = String(d[i][1]||'').trim();
        if (k === 'QUIZ_TIMER_SECONDS') { var n=parseInt(v,10); if(!isNaN(n)&&n>=5&&n<=300) cfg.seconds=n; }
      }
    }
    return { success:true, config:cfg };
  } catch(err) { return { success:false, message:err.message, config:{enabled:true,seconds:30} }; }
}

function saveQuizTimerConfig(enabled, seconds, userEmail) {
  // v6.2 — timer is mandatory; the enabled flag is ignored and forced to true.
  try {
    var sec = parseInt(seconds,10);
    if (isNaN(sec) || sec < 5 || sec > 300) return { success:false, message:'La durée doit être entre 5 et 300 secondes.' };
    saveSetting('QUIZ_TIMER_ENABLED', '1');
    saveSetting('QUIZ_TIMER_SECONDS', String(sec));
    logAudit('QUIZ_TIMER_CONFIG', 'timer', userEmail||'ADMIN', 'enabled=1 (forced) sec='+sec);
    return { success:true, config:{ enabled: true, seconds: sec } };
  } catch(err) { return { success:false, message:err.message }; }
}

// ============================================================
// QUIZ RESPONSES — manage records
// ============================================================
function deleteQuizResponse(sessionId, userEmail) {
  try {
    if (!sessionId) return { success:false, message:'sessionId requis' };
    var sh = getSpreadsheet().getSheetByName(SHEETS.QUIZ_RESPONSES);
    if (!sh || sh.getLastRow() <= 1) return { success:false, message:'Aucun enregistrement' };
    var data = sh.getDataRange().getValues();
    var headers = data[0].map(String);
    var iSession = headers.indexOf('SESSION_ID'); if (iSession < 0) iSession = 1;
    for (var i=1;i<data.length;i++) {
      if (String(data[i][iSession]||'').trim() === String(sessionId).trim()) {
        sh.deleteRow(i+1);
        logAudit('QUIZ_RESP_DELETED', sessionId, userEmail||'ADMIN', '');
        return { success:true, message:'Enregistrement supprimé.' };
      }
    }
    return { success:false, message:'Enregistrement introuvable: '+sessionId };
  } catch(err) { return { success:false, message:err.message }; }
}

function addManualQuizResponse(data, userEmail) {
  try {
    if (!data || !data.badge || !data.theme) return { success:false, message:'badge et theme requis' };
    var correct = parseInt(data.correctCount,10) || 0;
    var total   = parseInt(data.totalQ,10) || 0;
    if (total <= 0) return { success:false, message:'totalQ doit être > 0' };
    if (correct > total) correct = total;
    var pct = Math.round((correct/total)*100);
    var session = 'MANUAL-'+Date.now();
    return submitQuizAnswers(
      String(data.badge).trim(),
      session,
      correct,
      total,
      String(data.animateur||userEmail||'ADMIN').trim(),
      [],
      String(data.testType||'chaud').trim()
    );
  } catch(err) { return { success:false, message:err.message }; }
}

// ============================================================
// HYGIENE — ADVANCED STATISTICS (multi-filter + rankings)
// ============================================================
function getHygieneAdvancedStats(filters) {
  try {
    filters = filters || {};
    var res = getHygienePrpData(filters);
    if (!res.success) return res;
    var rows = res.data || [];

    var critKeys = ['tenue','propre','bijoux','mains','plaies','ongles','gants','hygiene'];
    var critLabels = {
      tenue:'Tenue réglementaire', propre:'Tenues propres', bijoux:'Bijoux',
      mains:'Mains propres', plaies:'Plaies non protégées', ongles:'Ongles',
      gants:'Gants', hygiene:'Comportement hygiénique'
    };

    var total = rows.length;
    var conformes = 0, nc = 0, mineure = 0, majeure = 0, critique = 0, openNc = 0;
    var byDept = {}, byShift = {}, byZone = {}, bySeverity = {}, byVerifier = {};
    var byCriterion = {}; critKeys.forEach(function(k){ byCriterion[critLabels[k]] = { nc:0, ok:0, na:0 }; });
    var byEmp = {};
    var byMonth = {}, byDay = {};

    function bucket(map, key) { key = String(key||'—').trim() || '—'; if(!map[key]) map[key]={count:0,nc:0,ncCount:0}; return map[key]; }

    rows.forEach(function(r) {
      var sev = String(r.SEVERITY||'').trim();
      var isNc = sev && sev !== 'Conforme';
      if (sev === 'Conforme') conformes++; else if (sev) nc++;
      if (sev === 'Mineure') mineure++;
      if (sev === 'Majeure') majeure++;
      if (sev === 'Critique') critique++;
      if (isNc && String(r.STATUS||'').toUpperCase() === 'OPEN') openNc++;

      var ncCnt = Number(r.NC_COUNT||0);

      var dEntry = bucket(byDept, r.EMP_DEPT); dEntry.count++; if(isNc) dEntry.nc++; dEntry.ncCount += ncCnt;
      var sEntry = bucket(byShift, r.SHIFT); sEntry.count++; if(isNc) sEntry.nc++; sEntry.ncCount += ncCnt;
      var zEntry = bucket(byZone, r.ZONE); zEntry.count++; if(isNc) zEntry.nc++; zEntry.ncCount += ncCnt;
      var vEntry = bucket(byVerifier, r.VER_NAME); vEntry.count++; if(isNc) vEntry.nc++; vEntry.ncCount += ncCnt;
      bySeverity[sev||'—'] = (bySeverity[sev||'—']||0)+1;

      critKeys.forEach(function(k) {
        var v = String(r['PRP_'+k.toUpperCase()]||'').toLowerCase();
        var lbl = critLabels[k];
        if (v === 'nc') byCriterion[lbl].nc++;
        else if (v === 'ok') byCriterion[lbl].ok++;
        else byCriterion[lbl].na++;
      });

      var empKey = String(r.EMP_BADGE||'')+'|'+String(r.EMP_NAME||'');
      if (!byEmp[empKey]) byEmp[empKey] = { badge:r.EMP_BADGE, name:r.EMP_NAME, dept:r.EMP_DEPT, controls:0, nc:0, ncCount:0 };
      byEmp[empKey].controls++;
      if (isNc) byEmp[empKey].nc++;
      byEmp[empKey].ncCount += ncCnt;

      if (r.timestamp) {
        var d = new Date(r.timestamp);
        var ym = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
        var ymd = ym+'-'+String(d.getDate()).padStart(2,'0');
        if (!byMonth[ym]) byMonth[ym] = { count:0, nc:0 };
        byMonth[ym].count++; if (isNc) byMonth[ym].nc++;
        if (!byDay[ymd]) byDay[ymd] = { count:0, nc:0 };
        byDay[ymd].count++; if (isNc) byDay[ymd].nc++;
      }
    });

    function rank(map, sortBy) {
      sortBy = sortBy || 'ncCount';
      return Object.keys(map).map(function(k){
        var v = map[k]; var rate = v.count ? Math.round((v.nc/v.count)*100) : 0;
        return { label:k, count:v.count, nc:v.nc, ncCount:v.ncCount, ncRate:rate };
      }).sort(function(a,b){ return (b[sortBy]||0) - (a[sortBy]||0); });
    }
    function rankCrit() {
      return Object.keys(byCriterion).map(function(k){
        var v = byCriterion[k]; var totalChecks = v.nc+v.ok;
        var rate = totalChecks ? Math.round((v.nc/totalChecks)*100) : 0;
        return { label:k, nc:v.nc, ok:v.ok, na:v.na, ncRate:rate };
      }).sort(function(a,b){ return b.nc - a.nc; });
    }
    function rankEmp() {
      return Object.keys(byEmp).map(function(k){
        var v = byEmp[k]; var rate = v.controls ? Math.round((v.nc/v.controls)*100) : 0;
        return { badge:v.badge, name:v.name, dept:v.dept, controls:v.controls, nc:v.nc, ncCount:v.ncCount, ncRate:rate };
      }).sort(function(a,b){ return b.ncCount - a.ncCount; });
    }

    var months = Object.keys(byMonth).sort().map(function(m){ return { month:m, count:byMonth[m].count, nc:byMonth[m].nc }; });
    var days   = Object.keys(byDay).sort().slice(-30).map(function(d){ return { day:d, count:byDay[d].count, nc:byDay[d].nc }; });

    return {
      success:true,
      summary: {
        total: total, conformes: conformes, nc: nc,
        mineure: mineure, majeure: majeure, critique: critique,
        openNc: openNc,
        conformityRate: total ? Math.round((conformes/total)*100) : 0,
        ncRate: total ? Math.round((nc/total)*100) : 0
      },
      rankings: {
        departments: rank(byDept, 'ncCount'),
        shifts:      rank(byShift, 'ncCount'),
        zones:       rank(byZone, 'ncCount'),
        verifiers:   rank(byVerifier, 'count'),
        criteria:    rankCrit(),
        employees:   rankEmp().slice(0, 25)
      },
      distribution: { bySeverity: bySeverity },
      timeSeries: { months: months, days: days },
      filtersApplied: filters
    };
  } catch (err) {
    Logger.log('getHygieneAdvancedStats error: ' + err);
    return { success:false, message: err.message };
  }
}


// ============================================================
// v7.4 — POSTE_OBJECTIFS (Mandatory training matrix per job position)
// ============================================================
function _posteSheet_(){
  var ss = getSpreadsheet();
  var sh = ss.getSheetByName(SHEETS.POSTE_OBJECTIFS);
  if (!sh) sh = createSheetIfNotExists(ss, SHEETS.POSTE_OBJECTIFS, getPosteObjectifsHeaders());
  return sh;
}

function getPosteObjectifs() {
  try {
    var sh = _posteSheet_();
    if (sh.getLastRow() <= 1) return { success:true, data: [] };
    var rows = sh.getRange(2, 1, sh.getLastRow()-1, sh.getLastColumn()).getValues();
    var out = rows
      .filter(function(r){ return String(r[0]||'').trim(); })
      .map(function(r){
        var d = r[3];
        var iso = '';
        try { iso = d instanceof Date ? Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm') : String(d||''); } catch(_){}
        return {
          poste:     String(r[0]||'').trim(),
          themes:    String(r[1]||'').trim(),
          status:    String(r[2]||'active').trim().toLowerCase(),
          updatedAt: iso,
          updatedBy: String(r[4]||'').trim()
        };
      });
    return { success:true, data: out };
  } catch (err) {
    Logger.log('getPosteObjectifs: ' + err);
    return { success:false, message: err.message, data: [] };
  }
}

function savePosteObjectif(data, userEmail) {
  try {
    if (!data || !data.poste) return { success:false, message: 'Nom du poste requis.' };
    var sh = _posteSheet_();
    var newPoste = String(data.poste).trim();
    var origPoste = String(data.originalPoste || newPoste).trim();
    var themes = String(data.themes || '').split(',').map(function(t){return t.trim();}).filter(Boolean).join(', ');
    var status = (String(data.status||'active').toLowerCase()==='inactive') ? 'inactive' : 'active';
    var now = new Date();
    var who = userEmail || 'ADMIN';
    if (sh.getLastRow() > 1) {
      var rng = sh.getRange(2, 1, sh.getLastRow()-1, sh.getLastColumn());
      var vals = rng.getValues();
      for (var i = 0; i < vals.length; i++) {
        if (String(vals[i][0]||'').trim().toLowerCase() === origPoste.toLowerCase()) {
          sh.getRange(i+2, 1, 1, 5).setValues([[newPoste, themes, status, now, who]]);
          try { logAudit('POSTE_OBJ_UPDATED', newPoste, who, themes); } catch(_){}
          return { success:true, message:'Poste mis à jour.' };
        }
      }
    }
    sh.appendRow([newPoste, themes, status, now, who]);
    try { logAudit('POSTE_OBJ_CREATED', newPoste, who, themes); } catch(_){}
    return { success:true, message:'Poste créé.' };
  } catch (err) {
    Logger.log('savePosteObjectif: ' + err);
    return { success:false, message: err.message };
  }
}

function deletePosteObjectif(poste, userEmail) {
  try {
    if (!poste) return { success:false, message:'Nom du poste requis.' };
    var sh = _posteSheet_();
    if (sh.getLastRow() <= 1) return { success:false, message:'Aucun poste enregistré.' };
    var vals = sh.getRange(2, 1, sh.getLastRow()-1, sh.getLastColumn()).getValues();
    for (var i = 0; i < vals.length; i++) {
      if (String(vals[i][0]||'').trim().toLowerCase() === String(poste).trim().toLowerCase()) {
        sh.deleteRow(i+2);
        try { logAudit('POSTE_OBJ_DELETED', poste, userEmail||'ADMIN', ''); } catch(_){}
        return { success:true, message:'Poste supprimé.' };
      }
    }
    return { success:false, message:'Poste introuvable: '+poste };
  } catch (err) {
    Logger.log('deletePosteObjectif: ' + err);
    return { success:false, message: err.message };
  }
}

function setEmployeePoste(badge, poste, userEmail) {
  try {
    if (!badge) return { success:false, message:'`badge` requis.' };
    var ss = getSpreadsheet();
    var sh = ss.getSheetByName(SHEETS.EMPLOYEES);
    if (!sh) return { success:false, message:'EMPLOYEES introuvable.' };
    // ensure POSTE column exists
    if (sh.getLastColumn() < 4) {
      sh.insertColumnAfter(sh.getLastColumn());
      sh.getRange(1, sh.getLastColumn()).setValue('POSTE');
    }
    var vals = sh.getRange(2, 1, Math.max(1, sh.getLastRow()-1), sh.getLastColumn()).getValues();
    var clean = String(badge).trim();
    for (var i = 0; i < vals.length; i++) {
      if (String(vals[i][0]||'').trim() === clean) {
        sh.getRange(i+2, 4).setValue(String(poste||'').trim());
        try { logAudit('EMP_POSTE_SET', clean, userEmail||'ADMIN', String(poste||'')); } catch(_){}
        return { success:true };
      }
    }
    return { success:false, message:'Employé introuvable.' };
  } catch (err) {
    return { success:false, message: err.message };
  }
}

/**
 * Look up an employee's mandatory training themes for the kiosk.
 * Falls back to DEPARTMENT when no explicit POSTE is configured.
 * Also returns the list of themes the employee has already passed
 * (score >= 60% in QUIZ_RESPONSES).
 */
function getPosteRequiredThemes(badge) {
  try {
    if (!badge) return { success:false, message:'`badge` requis.' };
    var clean = String(badge).trim().replace(/\.0+$/, '').replace(/^0+([0-9]+)$/, '$1');
    var ss = getSpreadsheet();
    var empSh = ss.getSheetByName(SHEETS.EMPLOYEES);
    var poste = '', dept = '', name = '';
    if (empSh && empSh.getLastRow() > 1) {
      var cols = empSh.getLastColumn();
      var rows = empSh.getRange(2, 1, empSh.getLastRow()-1, cols).getValues();
      for (var i = 0; i < rows.length; i++) {
        if (String(rows[i][0]||'').trim() === clean) {
          name  = String(rows[i][1]||'').trim();
          dept  = String(rows[i][2]||'').trim();
          poste = cols >= 4 ? String(rows[i][3]||'').trim() : '';
          break;
        }
      }
    }
    var keyPoste = (poste || dept || '').trim();
    var required = [];
    var poRes = getPosteObjectifs();
    if (poRes && poRes.success) {
      for (var j = 0; j < poRes.data.length; j++) {
        var r = poRes.data[j];
        if (r.status !== 'active') continue;
        if (String(r.poste||'').trim().toLowerCase() === keyPoste.toLowerCase()) {
          required = String(r.themes||'').split(',').map(function(t){return t.trim();}).filter(Boolean);
          break;
        }
      }
    }
    // Pull completed themes from QUIZ_RESPONSES (score >= 60%)
    var completed = [];
    try {
      var qrSh = ss.getSheetByName(SHEETS.QUIZ_RESPONSES);
      if (qrSh && qrSh.getLastRow() > 1) {
        var qrHeaders = qrSh.getRange(1,1,1,qrSh.getLastColumn()).getValues()[0].map(String);
        var iBadge = qrHeaders.indexOf('BADGE');
        var iTheme = qrHeaders.indexOf('THEME');
        var iScore = qrHeaders.indexOf('SCORE');
        if (iBadge < 0) iBadge = 0;
        if (iTheme < 0) iTheme = 1;
        if (iScore < 0) iScore = 4;
        var qrData = qrSh.getRange(2,1,qrSh.getLastRow()-1,qrSh.getLastColumn()).getValues();
        var seen = {};
        for (var k = 0; k < qrData.length; k++) {
          if (String(qrData[k][iBadge]||'').trim() !== clean) continue;
          var pct = Number(qrData[k][iScore]||0);
          if (pct > 1 && pct <= 100) pct = pct/100;
          if (pct >= 0.6) {
            var t = String(qrData[k][iTheme]||'').trim();
            if (t && !seen[t.toLowerCase()]) { seen[t.toLowerCase()] = 1; completed.push(t); }
          }
        }
      }
    } catch(_){}
    return {
      success:   true,
      badge:     clean,
      name:      name,
      poste:     keyPoste || '—',
      required:  required,
      completed: completed
    };
  } catch (err) {
    Logger.log('getPosteRequiredThemes: ' + err);
    return { success:false, message: err.message, required: [], completed: [] };
  }
}

/**
 * v7.4 — Lightweight status toggle for the questions admin table.
 * Skips audit metadata reload — flips status row in one operation.
 */
function quickToggleQuizQuestion(questionId, status, userEmail) {
  return updateQuizQuestionStatus(questionId, status, userEmail);
}

