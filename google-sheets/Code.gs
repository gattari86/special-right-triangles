// ═══════════════════════════════════════════════════════════════════════════════
// ▲ SPECIAL RIGHT TRIANGLES — MYSTERY PUZZLE (Google Sheets Edition)
// ═══════════════════════════════════════════════════════════════════════════════
//
// HOW TO SET UP:
// 1. Open a new Google Sheet
// 2. Go to Extensions → Apps Script
// 3. Delete any existing code and paste this entire file
// 4. Click Save (Ctrl+S)
// 5. Close the Apps Script editor
// 6. Reload the Google Sheet — you'll see a "🔺 Triangle Puzzle" menu
// 7. Click  🔺 Triangle Puzzle → 🎮 Setup Puzzle
// 8. Authorize the script when prompted
// 9. Start solving!
//
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Problem Data ────────────────────────────────────────────────────────────
const PROBLEMS = [
  { id: 1,  type: "45-45-90", given: "leg = 8",       find: "hypotenuse", answer: "8sqrt(2)",   difficulty: 1 },
  { id: 2,  type: "30-60-90", given: "short = 4",     find: "long leg",   answer: "4sqrt(3)",   difficulty: 1 },
  { id: 3,  type: "30-60-90", given: "hyp = 12",      find: "short leg",  answer: "6",          difficulty: 1 },
  { id: 4,  type: "45-45-90", given: "hyp = 10√2",    find: "leg",        answer: "10",         difficulty: 1 },
  { id: 5,  type: "30-60-90", given: "short = 3√2",   find: "hypotenuse", answer: "6sqrt(2)",   difficulty: 2 },
  { id: 6,  type: "45-45-90", given: "leg = 5√3",     find: "hypotenuse", answer: "5sqrt(6)",   difficulty: 2 },
  { id: 7,  type: "30-60-90", given: "long = 9",      find: "short leg",  answer: "3sqrt(3)",   difficulty: 2 },
  { id: 8,  type: "45-45-90", given: "hyp = 14",      find: "leg",        answer: "7sqrt(2)",   difficulty: 2 },
  { id: 9,  type: "30-60-90", given: "hyp = 10√3",    find: "long leg",   answer: "15",         difficulty: 3 },
  { id: 10, type: "45-45-90", given: "leg = √6",      find: "hypotenuse", answer: "2sqrt(3)",   difficulty: 3 },
  { id: 11, type: "30-60-90", given: "long = 6√3",    find: "hypotenuse", answer: "12",         difficulty: 3 },
  { id: 12, type: "45-45-90", given: "hyp = 3√10",    find: "leg",        answer: "3sqrt(5)",   difficulty: 3 },
  { id: 13, type: "30-60-90", given: "short = 2√5",   find: "hypotenuse", answer: "4sqrt(5)",   difficulty: 4 },
  { id: 14, type: "45-45-90", given: "leg = 4√7",     find: "hypotenuse", answer: "4sqrt(14)",  difficulty: 4 },
  { id: 15, type: "30-60-90", given: "hyp = 8√2",     find: "short leg",  answer: "4sqrt(2)",   difficulty: 4 },
  { id: 16, type: "30-60-90", given: "long = 2√21",   find: "hypotenuse", answer: "4sqrt(7)",   difficulty: 4 },
];

const POINTS_MAP = { 1: 100, 2: 200, 3: 350, 4: 500 };

// Colors (dark theme)
const C = {
  bg:        "#0d1117",
  headerBg:  "#070b14",
  cardBg:    "#161b22",
  cardBgAlt: "#111821",
  inputBg:   "#1c2333",
  inputBgAlt:"#1a2538",
  text:      "#e0e8f0",
  textDim:   "#8899aa",
  textMuted: "#556677",
  cyan:      "#00f0ff",
  green:     "#00ff88",
  red:       "#ff4466",
  pink:      "#ff00aa",
  yellow:    "#ffcc00",
  orange:    "#ff6644",
  purple:    "#aa66ff",
  gridHide:  "#0d1117",
  gridBorder:"#1a2535",
};

// Mystery grid reveal — emojis that appear as problems are solved
const REVEAL = [
  "🔵","💜","🔴","🟡",
  "💎","⭐","🔮","🌟",
  "🔥","✨","🌈","🎯",
  "🏆","👑","🎨","🦖",
];

// ─── Hint System ─────────────────────────────────────────────────────────────
function getHints(problem) {
  const p = PROBLEMS[problem];
  if (!p) return ["Use the special right triangle ratios!"];
  const hints = [];

  if (p.type === "45-45-90") {
    if (p.find === "hypotenuse") {
      hints.push("In a 45-45-90, hypotenuse = leg × √2");
      hints.push("Multiply the given leg by √2");
      hints.push("Remember: a√b × √2 = a√(b×2). Simplify if possible!");
    } else {
      hints.push("In a 45-45-90, each leg = hypotenuse ÷ √2");
      hints.push("Divide the hypotenuse by √2, then rationalize");
      hints.push("To rationalize: multiply top and bottom by √2");
    }
  } else {
    // 30-60-90
    const givenType = p.given.split("=")[0].trim().toLowerCase();
    if (givenType.startsWith("short") && p.find.includes("long")) {
      hints.push("Long leg = short leg × √3");
      hints.push("Multiply the given short leg by √3");
    } else if (givenType.startsWith("short") && p.find.includes("hyp")) {
      hints.push("Hypotenuse = short leg × 2");
      hints.push("Just double the short leg value");
    } else if (givenType.startsWith("long") && p.find.includes("short")) {
      hints.push("Short leg = long leg ÷ √3. Rationalize!");
      hints.push("Divide by √3, then multiply top & bottom by √3");
      hints.push("√3 ÷ √3 = 1 and √3 × √3 = 3");
    } else if (givenType.startsWith("long") && p.find.includes("hyp")) {
      hints.push("First find the short leg (÷ √3), then double it.");
      hints.push("Short = long ÷ √3 (rationalize!), then × 2");
    } else if (givenType.startsWith("hyp") && p.find.includes("short")) {
      hints.push("Short leg = hypotenuse ÷ 2");
      hints.push("Just divide the hypotenuse by 2");
    } else if (givenType.startsWith("hyp") && p.find.includes("long")) {
      hints.push("Find the short leg first (÷ 2), then multiply by √3");
      hints.push("Short = hyp ÷ 2, then long = short × √3");
    }
  }

  if (hints.length === 0) hints.push("Use the special right triangle ratios!");
  return hints;
}

// ─── Answer Parsing & Checking ───────────────────────────────────────────────
function parseRadical(str) {
  if (!str || typeof str !== "string") {
    if (typeof str === "number") return str;
    return null;
  }
  str = str.toString().replace(/\s+/g, "").toLowerCase();

  // Plain number
  if (/^-?\d+(\.\d+)?$/.test(str)) return parseFloat(str);

  // NNsqrt(N) format
  var match = str.match(/^(-?\d*\.?\d*)\*?sqrt\((\d+)\)$/);
  if (match) {
    var coeff = (match[1] === "" || match[1] === undefined) ? 1 : parseFloat(match[1]);
    var radicand = parseInt(match[2]);
    return coeff * Math.sqrt(radicand);
  }

  // NN√N format (unicode)
  var match2 = str.match(/^(-?\d*\.?\d*)\*?[√](\d+)$/);
  if (match2) {
    var coeff2 = (match2[1] === "" || match2[1] === undefined) ? 1 : parseFloat(match2[1]);
    var radicand2 = parseInt(match2[2]);
    return coeff2 * Math.sqrt(radicand2);
  }

  return null;
}

function checkAnswer(userInput, correctAnswer) {
  var userVal = parseRadical(userInput);
  var correctVal = parseRadical(correctAnswer);
  if (userVal === null || correctVal === null) return false;
  return Math.abs(userVal - correctVal) < 0.001;
}

// ─── Level System ────────────────────────────────────────────────────────────
function getLevel(solved) {
  if (solved >= 16) return { title: "TRIANGLE LEGEND 👑", color: C.yellow };
  if (solved >= 12) return { title: "Geometry Wizard 🧙", color: C.purple };
  if (solved >= 8)  return { title: "Triangle Pro 🔥",    color: C.orange };
  if (solved >= 4)  return { title: "Shape Solver ⚡",    color: C.cyan };
  if (solved >= 1)  return { title: "Math Explorer 🔍",   color: C.green };
  return { title: "Ready to Start ▲", color: C.textMuted };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MENU & SETUP
// ═══════════════════════════════════════════════════════════════════════════════

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("🔺 Triangle Puzzle")
    .addItem("🎮 Setup Puzzle", "setupPuzzle")
    .addSeparator()
    .addItem("💡 Get Hint (select a problem row)", "showHint")
    .addItem("🔄 Reset All Progress", "resetAll")
    .addItem("📊 Show Stats", "showStats")
    .addSeparator()
    .addItem("🦖 Make Rex Dance!", "makeRexDance")
    .addToUi();
}

function setupPuzzle() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Remove old sheets if they exist
  var oldPuzzle = ss.getSheetByName("Puzzle");
  var oldData = ss.getSheetByName("_Data");

  // Need at least one other sheet before deleting
  var tempSheet = null;
  if (ss.getSheets().length === 1) {
    tempSheet = ss.insertSheet("_temp");
  }

  if (oldPuzzle) ss.deleteSheet(oldPuzzle);
  if (oldData) ss.deleteSheet(oldData);

  var puzzle = ss.insertSheet("Puzzle", 0);
  var data = ss.insertSheet("_Data");

  if (tempSheet) {
    try { ss.deleteSheet(tempSheet); } catch(e) {}
  }

  // Also delete Sheet1 if it exists and is empty
  var sheet1 = ss.getSheetByName("Sheet1");
  if (sheet1 && ss.getSheets().length > 2) {
    try { ss.deleteSheet(sheet1); } catch(e) {}
  }

  buildPuzzleSheet(puzzle);
  buildDataSheet(data);
  data.hideSheet();

  ss.setActiveSheet(puzzle);
  installTrigger();

  ss.toast("Puzzle ready! Type your answers in the green-bordered cells. 🔺", "▲ Setup Complete", 5);
}

// ─── Install Trigger ─────────────────────────────────────────────────────────
function installTrigger() {
  // Remove existing triggers for this function
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "onEditTrigger") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  // Install new one
  ScriptApp.newTrigger("onEditTrigger")
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onEdit()
    .create();
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUILD THE PUZZLE SHEET
// ═══════════════════════════════════════════════════════════════════════════════

function buildPuzzleSheet(sheet) {
  // Expand the sheet
  if (sheet.getMaxRows() < 30) sheet.insertRowsAfter(sheet.getMaxRows(), 30 - sheet.getMaxRows());
  if (sheet.getMaxColumns() < 14) sheet.insertColumnsAfter(sheet.getMaxColumns(), 14 - sheet.getMaxColumns());

  // Dark background for entire visible area
  sheet.getRange(1, 1, 30, 14).setBackground(C.bg);

  // ─── Column widths ───
  sheet.setColumnWidth(1, 40);   // #
  sheet.setColumnWidth(2, 100);  // Type
  sheet.setColumnWidth(3, 150);  // Given
  sheet.setColumnWidth(4, 110);  // Find
  sheet.setColumnWidth(5, 150);  // YOUR ANSWER
  sheet.setColumnWidth(6, 60);   // Result
  sheet.setColumnWidth(7, 80);   // Points
  sheet.setColumnWidth(8, 100);  // Difficulty
  sheet.setColumnWidth(9, 20);   // spacer
  sheet.setColumnWidth(10, 60);  // Mystery grid
  sheet.setColumnWidth(11, 60);
  sheet.setColumnWidth(12, 60);
  sheet.setColumnWidth(13, 60);
  sheet.setColumnWidth(14, 20);  // spacer

  // ─── ROW 1: Title ───
  sheet.getRange("A1:H1").merge()
    .setValue("▲ SPECIAL RIGHT TRIANGLES — MYSTERY PUZZLE ▲")
    .setFontFamily("Consolas,monospace")
    .setFontSize(14)
    .setFontWeight("bold")
    .setFontColor(C.cyan)
    .setBackground(C.headerBg)
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");
  sheet.setRowHeight(1, 42);

  // ─── ROW 2: Subtitle ───
  sheet.getRange("A2:H2").merge()
    .setValue("Type answers like: 4sqrt(3) or 12  |  First-try = bonus points!")
    .setFontFamily("Consolas,monospace")
    .setFontSize(9)
    .setFontColor(C.textMuted)
    .setBackground(C.headerBg)
    .setHorizontalAlignment("center");
  sheet.setRowHeight(2, 22);

  // ─── ROW 3: Dashboard ───
  var dashLabels = ["SCORE:", "", "STREAK:", "", "BEST:", "", "LEVEL:", ""];
  var dashValues = ["", "0", "", "0", "", "0", "", "Ready to Start ▲"];
  var dashRow = sheet.getRange("A3:H3");
  dashRow.setBackground(C.headerBg).setFontFamily("Consolas,monospace").setVerticalAlignment("middle");

  // Score label + value
  sheet.getRange("A3").setValue("SCORE:")
    .setFontSize(9).setFontColor(C.textMuted).setHorizontalAlignment("right");
  sheet.getRange("B3").setValue(0)
    .setFontSize(13).setFontWeight("bold").setFontColor(C.yellow)
    .setHorizontalAlignment("left").setNumberFormat("#,##0");

  // Streak
  sheet.getRange("C3").setValue("STREAK:")
    .setFontSize(9).setFontColor(C.textMuted).setHorizontalAlignment("right");
  sheet.getRange("D3").setValue(0)
    .setFontSize(13).setFontWeight("bold").setFontColor(C.orange).setHorizontalAlignment("left");

  // Best
  sheet.getRange("E3").setValue("BEST:")
    .setFontSize(9).setFontColor(C.textMuted).setHorizontalAlignment("right");
  sheet.getRange("F3").setValue(0)
    .setFontSize(13).setFontWeight("bold").setFontColor(C.purple).setHorizontalAlignment("left");

  // Level
  sheet.getRange("G3").setValue("LEVEL:")
    .setFontSize(9).setFontColor(C.textMuted).setHorizontalAlignment("right");
  sheet.getRange("H3").setValue("Ready to Start ▲")
    .setFontSize(9).setFontWeight("bold").setFontColor(C.textMuted).setHorizontalAlignment("left");

  sheet.setRowHeight(3, 28);

  // ─── ROW 4: Progress bar ───
  sheet.getRange("A4:H4").merge()
    .setValue("░░░░░░░░░░░░░░░░  0 / 16")
    .setFontFamily("Consolas,monospace")
    .setFontSize(11)
    .setFontColor(C.textMuted)
    .setBackground(C.bg)
    .setHorizontalAlignment("center");
  sheet.setRowHeight(4, 24);

  // ─── ROW 5: Spacer ───
  sheet.setRowHeight(5, 6);

  // ─── ROW 6: Column Headers ───
  var headers = ["#", "TYPE", "GIVEN", "FIND", "✏️ YOUR ANSWER", "✓/✗", "POINTS", "DIFFICULTY"];
  sheet.getRange("A6:H6").setValues([headers])
    .setFontFamily("Consolas,monospace")
    .setFontSize(9)
    .setFontWeight("bold")
    .setFontColor(C.cyan)
    .setBackground("#0a1020")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");
  sheet.getRange("A6:H6").setBorder(null, null, true, null, null, null, C.cyan, SpreadsheetApp.BorderStyle.SOLID);
  sheet.setRowHeight(6, 26);

  // ─── ROWS 7-22: Problem Rows ───
  for (var i = 0; i < PROBLEMS.length; i++) {
    var p = PROBLEMS[i];
    var row = 7 + i;
    var isAlt = (i % 2 === 1);
    var rowBg = isAlt ? C.cardBgAlt : C.cardBg;
    var inputBg = isAlt ? C.inputBgAlt : C.inputBg;
    var typeColor = (p.type === "45-45-90") ? C.cyan : C.pink;
    var stars = "";
    for (var s = 0; s < p.difficulty; s++) stars += "★";
    for (var s2 = p.difficulty; s2 < 4; s2++) stars += "☆";

    // # column
    sheet.getRange(row, 1).setValue(p.id)
      .setFontFamily("Consolas,monospace").setFontSize(10).setFontWeight("bold")
      .setFontColor(C.cyan).setBackground(rowBg).setHorizontalAlignment("center");

    // Type
    sheet.getRange(row, 2).setValue(p.type)
      .setFontFamily("Consolas,monospace").setFontSize(9).setFontWeight("bold")
      .setFontColor(typeColor).setBackground(rowBg).setHorizontalAlignment("center");

    // Given
    sheet.getRange(row, 3).setValue(p.given)
      .setFontFamily("Consolas,monospace").setFontSize(10)
      .setFontColor(C.text).setBackground(rowBg).setHorizontalAlignment("center");

    // Find
    sheet.getRange(row, 4).setValue(p.find)
      .setFontFamily("Consolas,monospace").setFontSize(10).setFontWeight("bold")
      .setFontColor(C.yellow).setBackground(rowBg).setHorizontalAlignment("center");

    // Answer input (empty, highlighted)
    sheet.getRange(row, 5)
      .setFontFamily("Consolas,monospace").setFontSize(11).setFontWeight("bold")
      .setFontColor("#ffffff").setBackground(inputBg).setHorizontalAlignment("center")
      .setVerticalAlignment("middle");
    sheet.getRange(row, 5).setBorder(true, true, true, true, null, null,
      C.cyan, SpreadsheetApp.BorderStyle.SOLID);

    // Result (empty)
    sheet.getRange(row, 6).setValue("")
      .setFontFamily("Consolas,monospace").setFontSize(16)
      .setFontColor(C.textDim).setBackground(rowBg).setHorizontalAlignment("center");

    // Points (empty until solved)
    sheet.getRange(row, 7).setValue("")
      .setFontFamily("Consolas,monospace").setFontSize(10)
      .setFontColor(C.yellow).setBackground(rowBg).setHorizontalAlignment("center");

    // Difficulty
    sheet.getRange(row, 8).setValue(stars)
      .setFontFamily("Consolas,monospace").setFontSize(10)
      .setFontColor(C.yellow).setBackground(rowBg).setHorizontalAlignment("center");

    sheet.setRowHeight(row, 30);
  }

  // ─── ROW 23: Spacer ───
  sheet.setRowHeight(23, 12);

  // ─── ROW 24: Reference Cards ───
  sheet.getRange("A24:D24").merge()
    .setValue("📐 45-45-90:  Legs = x  |  Hyp = x√2")
    .setFontFamily("Consolas,monospace").setFontSize(10)
    .setFontColor(C.cyan).setBackground("#0a1525")
    .setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.getRange("A24:D24").setBorder(true, true, true, true, null, null,
    C.cyan, SpreadsheetApp.BorderStyle.SOLID);

  sheet.getRange("E24:H24").merge()
    .setValue("📐 30-60-90:  Short = x  |  Long = x√3  |  Hyp = 2x")
    .setFontFamily("Consolas,monospace").setFontSize(10)
    .setFontColor(C.pink).setBackground("#1a0a20")
    .setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.getRange("E24:H24").setBorder(true, true, true, true, null, null,
    C.pink, SpreadsheetApp.BorderStyle.SOLID);

  sheet.setRowHeight(24, 32);

  // ─── MYSTERY GRID (4x4 in columns J-M, rows 7-10) ───
  sheet.getRange("J6:M6").merge()
    .setValue("▲ MYSTERY IMAGE ▲")
    .setFontFamily("Consolas,monospace").setFontSize(9).setFontWeight("bold")
    .setFontColor(C.textMuted).setBackground(C.bg)
    .setHorizontalAlignment("center");

  for (var r = 0; r < 4; r++) {
    for (var cc = 0; cc < 4; cc++) {
      var cellRow = 7 + r;
      var cellCol = 10 + cc;
      var idx = r * 4 + cc + 1;
      sheet.getRange(cellRow, cellCol)
        .setValue(idx)
        .setFontFamily("Consolas,monospace").setFontSize(16).setFontWeight("bold")
        .setFontColor("#1a2030").setBackground(C.gridHide)
        .setHorizontalAlignment("center").setVerticalAlignment("middle");
      sheet.getRange(cellRow, cellCol).setBorder(true, true, true, true, null, null,
        C.gridBorder, SpreadsheetApp.BorderStyle.SOLID);
    }
  }

  // Mystery grid label below
  sheet.getRange("J11:M11").merge()
    .setValue("Solve problems to reveal!")
    .setFontFamily("Consolas,monospace").setFontSize(8)
    .setFontColor(C.textMuted).setBackground(C.bg)
    .setHorizontalAlignment("center");

  // ─── Rex idle (right of mystery grid) ───
  sheet.getRange("J13:M13").merge()
    .setValue("🦖")
    .setFontSize(28)
    .setBackground(C.bg)
    .setHorizontalAlignment("center");
  sheet.getRange("J14:M14").merge()
    .setValue("Rex is watching...")
    .setFontFamily("Consolas,monospace").setFontSize(8)
    .setFontColor(C.textMuted).setBackground(C.bg)
    .setHorizontalAlignment("center");

  // Freeze header rows
  sheet.setFrozenRows(6);

  // Protect non-input columns
  var protection = sheet.protect().setDescription("Puzzle layout");
  var unprotected = [];
  for (var pr = 7; pr <= 22; pr++) {
    unprotected.push(sheet.getRange(pr, 5)); // column E (answer cells)
  }
  protection.setUnprotectedRanges(unprotected);
  protection.setWarningOnly(true);
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUILD THE HIDDEN DATA SHEET
// ═══════════════════════════════════════════════════════════════════════════════

function buildDataSheet(data) {
  // Column A: correct answers
  // Column B: difficulty
  // Column C: solved (0/1)
  // Column D: attempts
  // Column E: streak
  // Column F: best streak
  // Column G: score

  // Headers
  data.getRange("A1:G1").setValues([["Answer", "Difficulty", "Solved", "Attempts", "Streak", "BestStreak", "Score"]]);

  for (var i = 0; i < PROBLEMS.length; i++) {
    var row = 2 + i;
    data.getRange(row, 1).setValue(PROBLEMS[i].answer);
    data.getRange(row, 2).setValue(PROBLEMS[i].difficulty);
    data.getRange(row, 3).setValue(0); // not solved
    data.getRange(row, 4).setValue(0); // attempts
  }

  // Global state in row 20
  data.getRange("E20").setValue(0); // current streak
  data.getRange("F20").setValue(0); // best streak
  data.getRange("G20").setValue(0); // total score
}

// ═══════════════════════════════════════════════════════════════════════════════
// EDIT TRIGGER — REAL-TIME ANSWER CHECKING
// ═══════════════════════════════════════════════════════════════════════════════

function onEditTrigger(e) {
  try {
    var sheet = e.source.getActiveSheet();
    if (sheet.getName() !== "Puzzle") return;

    var row = e.range.getRow();
    var col = e.range.getColumn();

    // Only respond to answer cells: column 5 (E), rows 7-22
    if (col !== 5 || row < 7 || row > 22) return;

    var userAnswer = e.range.getValue();
    if (!userAnswer || userAnswer.toString().trim() === "") {
      // Cleared the cell — reset that row's result
      sheet.getRange(row, 6).setValue("");
      sheet.getRange(row, 7).setValue("");
      // Reset input cell border to cyan
      sheet.getRange(row, 5).setBorder(true, true, true, true, null, null,
        C.cyan, SpreadsheetApp.BorderStyle.SOLID);
      return;
    }

    var ss = e.source;
    var data = ss.getSheetByName("_Data");
    if (!data) return;

    var problemIdx = row - 7; // 0-based
    var correctAnswer = data.getRange(problemIdx + 2, 1).getValue();
    var alreadySolved = data.getRange(problemIdx + 2, 3).getValue() == 1;

    if (alreadySolved) {
      ss.toast("Already solved! ✓", "Problem #" + (problemIdx + 1), 2);
      return;
    }

    var isCorrect = checkAnswer(userAnswer.toString().trim(), correctAnswer.toString());

    if (isCorrect) {
      // ── CORRECT! ──
      var difficulty = data.getRange(problemIdx + 2, 2).getValue();
      var attempts = data.getRange(problemIdx + 2, 4).getValue();
      var basePoints = POINTS_MAP[difficulty] || 100;
      var firstTryBonus = (attempts === 0) ? Math.round(basePoints * 0.5) : 0;

      // Update streak
      var currentStreak = data.getRange("E20").getValue() + 1;
      var bestStreak = data.getRange("F20").getValue();
      var streakBonus = 0;
      if (currentStreak >= 5) streakBonus = Math.round(basePoints * 0.3);
      else if (currentStreak >= 3) streakBonus = Math.round(basePoints * 0.15);

      var totalPoints = basePoints + firstTryBonus + streakBonus;
      var currentScore = data.getRange("G20").getValue() + totalPoints;
      if (currentStreak > bestStreak) bestStreak = currentStreak;

      // Save to data sheet
      data.getRange(problemIdx + 2, 3).setValue(1); // solved
      data.getRange("E20").setValue(currentStreak);
      data.getRange("F20").setValue(bestStreak);
      data.getRange("G20").setValue(currentScore);

      // Update puzzle sheet — result cell
      sheet.getRange(row, 6).setValue("✓")
        .setFontColor(C.green).setFontSize(16);

      // Points earned
      var pointsText = "+" + totalPoints;
      if (firstTryBonus > 0) pointsText += " 🎯";
      if (streakBonus > 0) pointsText += " 🔥";
      sheet.getRange(row, 7).setValue(pointsText)
        .setFontColor(C.green).setFontSize(9);

      // Green border on solved input
      sheet.getRange(row, 5).setBorder(true, true, true, true, null, null,
        C.green, SpreadsheetApp.BorderStyle.SOLID)
        .setFontColor(C.green);

      // Green tint on the entire row
      sheet.getRange(row, 1, 1, 4).setBackground("#0a1a10");
      sheet.getRange(row, 6, 1, 3).setBackground("#0a1a10");
      sheet.getRange(row, 5).setBackground("#0d2015");

      // Update dashboard
      updateDashboard(sheet, data);

      // Toast feedback
      var solvedCount = countSolved(data);
      var msg = "+" + totalPoints + " points!";
      if (firstTryBonus > 0) msg += " (First try bonus!)";
      if (currentStreak >= 3) msg += " 🔥 " + currentStreak + " streak!";
      if (solvedCount === 16) {
        msg = "🏆 ALL 16 SOLVED! TRIANGLE LEGEND! Final score: " + currentScore.toLocaleString();
      }
      ss.toast(msg, "✓ Correct! #" + (problemIdx + 1), 3);

    } else {
      // ── WRONG ──
      var attempts2 = data.getRange(problemIdx + 2, 4).getValue() + 1;
      data.getRange(problemIdx + 2, 4).setValue(attempts2);

      // Reset streak
      data.getRange("E20").setValue(0);

      // Red result
      sheet.getRange(row, 6).setValue("✗")
        .setFontColor(C.red).setFontSize(16);

      // Red border
      sheet.getRange(row, 5).setBorder(true, true, true, true, null, null,
        C.red, SpreadsheetApp.BorderStyle.SOLID);

      // Update dashboard (streak reset)
      updateDashboard(sheet, data);

      var hint = "";
      if (attempts2 >= 2) hint = " Try the hint! (🔺 menu → 💡)";
      ss.toast("Not quite — try again!" + hint, "✗ Problem #" + (problemIdx + 1), 3);

      // Reset border color after 2 seconds via a time-based approach
      // (Can't do setTimeout in Apps Script, so we reset on next edit or leave it)
      // Instead, reset to cyan after showing red briefly — user will see it flash
      Utilities.sleep(1500);
      if (data.getRange(problemIdx + 2, 3).getValue() != 1) {
        sheet.getRange(row, 5).setBorder(true, true, true, true, null, null,
          C.cyan, SpreadsheetApp.BorderStyle.SOLID);
        sheet.getRange(row, 6).setValue("");
      }
    }
  } catch (err) {
    // Silently fail — don't break the sheet
    Logger.log("onEditTrigger error: " + err.toString());
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD UPDATE
// ═══════════════════════════════════════════════════════════════════════════════

function updateDashboard(sheet, data) {
  var score = data.getRange("G20").getValue();
  var streak = data.getRange("E20").getValue();
  var best = data.getRange("F20").getValue();
  var solved = countSolved(data);
  var level = getLevel(solved);

  // Score
  sheet.getRange("B3").setValue(score);

  // Streak
  sheet.getRange("D3").setValue(streak)
    .setFontColor(streak >= 5 ? C.orange : streak >= 3 ? C.yellow : C.orange);

  // Best
  sheet.getRange("F3").setValue(best);

  // Level
  sheet.getRange("H3").setValue(level.title).setFontColor(level.color);

  // Progress bar
  var filled = "";
  var empty = "";
  for (var i = 0; i < solved; i++) filled += "█";
  for (var j = solved; j < 16; j++) empty += "░";

  var progressColor = C.textMuted;
  if (solved === 16) progressColor = C.yellow;
  else if (solved >= 8) progressColor = C.green;
  else if (solved >= 1) progressColor = C.cyan;

  sheet.getRange("A4:H4").merge()
    .setValue(filled + empty + "  " + solved + " / 16")
    .setFontColor(progressColor);

  // Update mystery grid
  updateMysteryGrid(sheet, solved);

  // Victory state
  if (solved === 16) {
    sheet.getRange("A1:H1")
      .setValue("🏆 TRIANGLE LEGEND — ALL 16 SOLVED! 🏆")
      .setFontColor(C.yellow);
    sheet.getRange("J14:M14").merge()
      .setValue("Rex is proud of you! 🎉")
      .setFontColor(C.green);
  }
}

function countSolved(data) {
  var count = 0;
  for (var i = 2; i <= 17; i++) {
    if (data.getRange(i, 3).getValue() == 1) count++;
  }
  return count;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MYSTERY GRID
// ═══════════════════════════════════════════════════════════════════════════════

function updateMysteryGrid(sheet, solvedCount) {
  var revealColors = [
    "#1a3050","#2a1a50","#501a1a","#50501a",
    "#1a5050","#504a1a","#3a1a50","#1a5030",
    "#503a1a","#1a3a50","#401a40","#1a5040",
    "#50401a","#50501a","#1a5050","#44dd66",
  ];

  for (var r = 0; r < 4; r++) {
    for (var cc = 0; cc < 4; cc++) {
      var idx = r * 4 + cc;
      var cellRow = 7 + r;
      var cellCol = 10 + cc;
      if (idx < solvedCount) {
        // Reveal!
        sheet.getRange(cellRow, cellCol)
          .setValue(REVEAL[idx])
          .setFontSize(22)
          .setFontColor("#ffffff")
          .setBackground(revealColors[idx]);
        sheet.getRange(cellRow, cellCol).setBorder(true, true, true, true, null, null,
          C.cyan, SpreadsheetApp.BorderStyle.SOLID);
      }
    }
  }

  // If all solved, add a golden border to the whole grid
  if (solvedCount >= 16) {
    sheet.getRange(7, 10, 4, 4).setBorder(true, true, true, true, true, true,
      C.yellow, SpreadsheetApp.BorderStyle.SOLID_THICK);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HINTS
// ═══════════════════════════════════════════════════════════════════════════════

function showHint() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();

  if (sheet.getName() !== "Puzzle") {
    ss.toast("Switch to the Puzzle sheet first!", "⚠️", 3);
    return;
  }

  var row = sheet.getActiveRange().getRow();
  if (row < 7 || row > 22) {
    ss.toast("Click on a problem row first (rows 7-22), then try again.", "💡 Hint", 3);
    return;
  }

  var problemIdx = row - 7;
  var data = ss.getSheetByName("_Data");
  if (!data) return;

  var attempts = data.getRange(problemIdx + 2, 4).getValue();
  var solved = data.getRange(problemIdx + 2, 3).getValue() == 1;

  if (solved) {
    ss.toast("You already solved this one! ✓", "Problem #" + (problemIdx + 1), 2);
    return;
  }

  var hints = getHints(problemIdx);
  var hintIdx = Math.min(attempts, hints.length - 1);
  var hintText = hints[hintIdx];

  var p = PROBLEMS[problemIdx];
  var title = "💡 Hint — #" + p.id + " (" + p.type + ")";

  // Show as a dialog for better visibility
  var html = HtmlService.createHtmlOutput(
    '<div style="font-family:Consolas,monospace;padding:16px;background:#0d1117;color:#e0e8f0;border-radius:12px;min-height:80px;">' +
      '<div style="color:#ffcc00;font-size:11px;margin-bottom:8px;">PROBLEM #' + p.id + ' — ' + p.type + '</div>' +
      '<div style="color:#8899aa;font-size:11px;margin-bottom:4px;">Given: ' + p.given + ' → Find: ' + p.find + '</div>' +
      '<hr style="border-color:#1a2535;margin:10px 0;">' +
      '<div style="color:#ffcc00;font-size:14px;line-height:1.5;">' + hintText + '</div>' +
      (attempts > 0 ? '<div style="color:#556677;font-size:10px;margin-top:12px;">Attempts so far: ' + attempts + '</div>' : '') +
    '</div>'
  ).setWidth(380).setHeight(180);

  SpreadsheetApp.getUi().showModalDialog(html, title);
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESET
// ═══════════════════════════════════════════════════════════════════════════════

function resetAll() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert(
    "🔄 Reset All Progress",
    "This will clear all your answers, scores, and streaks. Are you sure?",
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) return;

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Puzzle");
  var data = ss.getSheetByName("_Data");

  if (!sheet || !data) {
    ss.toast("Run Setup first!", "⚠️", 3);
    return;
  }

  // Clear answer cells and results
  for (var i = 0; i < 16; i++) {
    var row = 7 + i;
    var isAlt = (i % 2 === 1);
    var rowBg = isAlt ? C.cardBgAlt : C.cardBg;
    var inputBg = isAlt ? C.inputBgAlt : C.inputBg;

    sheet.getRange(row, 5).setValue("")
      .setFontColor("#ffffff").setBackground(inputBg);
    sheet.getRange(row, 5).setBorder(true, true, true, true, null, null,
      C.cyan, SpreadsheetApp.BorderStyle.SOLID);
    sheet.getRange(row, 6).setValue("").setFontColor(C.textDim);
    sheet.getRange(row, 7).setValue("");

    // Reset row backgrounds
    sheet.getRange(row, 1, 1, 4).setBackground(rowBg);
    sheet.getRange(row, 6, 1, 3).setBackground(rowBg);
  }

  // Reset data sheet
  for (var j = 2; j <= 17; j++) {
    data.getRange(j, 3).setValue(0); // solved
    data.getRange(j, 4).setValue(0); // attempts
  }
  data.getRange("E20").setValue(0);
  data.getRange("F20").setValue(0);
  data.getRange("G20").setValue(0);

  // Reset mystery grid
  for (var r2 = 0; r2 < 4; r2++) {
    for (var c2 = 0; c2 < 4; c2++) {
      var cellRow = 7 + r2;
      var cellCol = 10 + c2;
      var idx = r2 * 4 + c2 + 1;
      sheet.getRange(cellRow, cellCol)
        .setValue(idx)
        .setFontSize(16).setFontWeight("bold")
        .setFontColor("#1a2030").setBackground(C.gridHide);
      sheet.getRange(cellRow, cellCol).setBorder(true, true, true, true, null, null,
        C.gridBorder, SpreadsheetApp.BorderStyle.SOLID);
    }
  }

  // Reset title and Rex
  sheet.getRange("A1:H1")
    .setValue("▲ SPECIAL RIGHT TRIANGLES — MYSTERY PUZZLE ▲")
    .setFontColor(C.cyan);
  sheet.getRange("J14:M14").merge()
    .setValue("Rex is watching...")
    .setFontColor(C.textMuted);

  // Reset dashboard
  updateDashboard(sheet, data);

  ss.toast("All progress cleared. Fresh start! 🔺", "🔄 Reset", 3);
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATS
// ═══════════════════════════════════════════════════════════════════════════════

function showStats() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var data = ss.getSheetByName("_Data");
  if (!data) {
    ss.toast("Run Setup first!", "⚠️", 3);
    return;
  }

  var solved = countSolved(data);
  var score = data.getRange("G20").getValue();
  var streak = data.getRange("E20").getValue();
  var best = data.getRange("F20").getValue();
  var level = getLevel(solved);

  // Count by difficulty
  var byDiff = { 1: 0, 2: 0, 3: 0, 4: 0 };
  var totalAttempts = 0;
  var firstTries = 0;
  for (var i = 0; i < 16; i++) {
    var isSolved = data.getRange(i + 2, 3).getValue() == 1;
    var att = data.getRange(i + 2, 4).getValue();
    var diff = data.getRange(i + 2, 2).getValue();
    if (isSolved) {
      byDiff[diff] = (byDiff[diff] || 0) + 1;
      totalAttempts += (att + 1); // att is wrong attempts, +1 for the correct one
      if (att === 0) firstTries++;
    }
  }

  var accuracy = solved > 0 ? Math.round((firstTries / solved) * 100) : 0;
  var maxScore = 0;
  for (var d = 1; d <= 4; d++) {
    var count = 0;
    for (var j = 0; j < PROBLEMS.length; j++) {
      if (PROBLEMS[j].difficulty === d) count++;
    }
    maxScore += count * (POINTS_MAP[d] + Math.round(POINTS_MAP[d] * 0.5)); // with first-try bonus
  }

  var html = HtmlService.createHtmlOutput(
    '<div style="font-family:Consolas,monospace;padding:20px;background:#0d1117;color:#e0e8f0;line-height:1.8;">' +
      '<div style="text-align:center;margin-bottom:16px;">' +
        '<div style="font-size:28px;">' + (solved >= 16 ? '👑' : level.title.slice(-2)) + '</div>' +
        '<div style="color:' + level.color + ';font-size:16px;font-weight:bold;">' + level.title + '</div>' +
      '</div>' +
      '<div style="background:#161b22;padding:12px;border-radius:8px;border:1px solid #1a2535;">' +
        '<div>📊 Score: <span style="color:#ffcc00;font-weight:bold;">' + score.toLocaleString() + '</span></div>' +
        '<div>✅ Solved: <span style="color:#00ff88;">' + solved + ' / 16</span></div>' +
        '<div>🔥 Best Streak: <span style="color:#ff6644;">' + best + '</span></div>' +
        '<div>🎯 First-Try Rate: <span style="color:#00f0ff;">' + accuracy + '%</span> (' + firstTries + '/' + solved + ')</div>' +
      '</div>' +
      '<div style="margin-top:12px;background:#161b22;padding:12px;border-radius:8px;border:1px solid #1a2535;">' +
        '<div style="color:#8899aa;font-size:10px;margin-bottom:4px;">BY DIFFICULTY:</div>' +
        '<div>★☆☆☆ Easy: ' + (byDiff[1]||0) + '/4</div>' +
        '<div>★★☆☆ Medium: ' + (byDiff[2]||0) + '/4</div>' +
        '<div>★★★☆ Hard: ' + (byDiff[3]||0) + '/4</div>' +
        '<div>★★★★ Expert: ' + (byDiff[4]||0) + '/4</div>' +
      '</div>' +
    '</div>'
  ).setWidth(340).setHeight(380);

  SpreadsheetApp.getUi().showModalDialog(html, "📊 Puzzle Stats");
}

// ═══════════════════════════════════════════════════════════════════════════════
// REX DANCE! 🦖
// ═══════════════════════════════════════════════════════════════════════════════

function makeRexDance() {
  var html = HtmlService.createHtmlOutput(`
    <style>
      body { margin:0; background:#0d1117; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:280px; font-family:Consolas,monospace; }
      .rex-container { position:relative; }
      canvas { image-rendering:pixelated; image-rendering:crisp-edges; }
      .notes { position:absolute; top:-10px; right:-15px; font-size:18px; animation:noteFloat 0.8s ease-out infinite; }
      .notes2 { position:absolute; top:0; left:-12px; font-size:14px; animation:noteFloat 1s ease-out infinite 0.3s; }
      @keyframes noteFloat { 0%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(-25px)} }
      @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
      .bouncing { animation: bounce 0.44s ease-in-out infinite; }
      .btn { background:linear-gradient(135deg,#44dd66,#00aa44); border:none; border-radius:8px; padding:8px 20px;
             color:#0d1117; font-family:Consolas,monospace; font-size:12px; font-weight:bold; cursor:pointer; margin-top:16px; }
      .btn:hover { filter:brightness(1.2); }
      .btn.stop { background:linear-gradient(135deg,#ff6644,#cc3300); color:white; }
      .status { color:#8899aa; font-size:10px; margin-top:8px; }
    </style>
    <div class="rex-container" id="rexWrap">
      <canvas id="rex" width="128" height="128"></canvas>
      <div class="notes" id="n1" style="display:none">♪</div>
      <div class="notes2" id="n2" style="display:none">♫</div>
    </div>
    <button class="btn" id="danceBtn" onclick="toggleDance()">🦖 Make Rex Dance!</button>
    <div class="status" id="status">Rex is chilling...</div>
    <script>
      var IDLE=[[0,0,0,0,0,0,0,2,2,2,2,0,0,0,0,0],[0,0,0,0,0,0,2,1,1,1,1,2,0,0,0,0],[0,0,0,0,0,0,2,1,4,1,1,2,0,0,0,0],[0,0,0,0,0,0,2,1,1,1,1,2,0,0,0,0],[0,0,0,0,0,0,2,1,5,5,2,0,0,0,0,0],[0,0,0,0,0,2,2,1,1,2,0,0,0,0,0,0],[0,0,0,0,2,1,1,1,1,2,0,0,0,0,0,0],[0,0,0,0,2,1,3,3,1,2,0,0,0,0,0,0],[0,0,0,0,2,1,3,3,1,1,2,0,0,0,0,0],[0,0,0,2,1,1,1,1,1,2,0,0,0,0,0,0],[0,0,0,2,1,1,1,1,1,2,0,0,0,0,0,0],[0,0,0,0,2,1,1,1,2,0,0,0,0,0,0,0],[0,0,0,0,2,1,2,1,2,0,0,0,0,0,0,0],[0,0,0,0,2,1,2,1,2,0,0,0,0,0,0,0],[0,0,0,0,2,2,0,2,2,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]];
      var D1=[[0,0,0,0,0,0,0,0,2,2,2,2,0,0,0,0],[0,0,0,0,0,0,0,2,1,1,1,1,2,0,0,0],[0,0,0,0,0,0,0,2,1,4,1,1,2,0,0,0],[0,0,0,0,0,0,0,2,1,1,1,1,2,0,0,0],[0,0,0,0,0,0,0,2,1,5,5,2,0,0,0,0],[0,0,2,2,0,0,2,2,1,1,2,0,0,0,0,0],[0,0,0,2,1,2,1,1,1,1,2,0,0,0,0,0],[0,0,0,0,2,1,1,3,3,1,2,0,0,0,0,0],[0,0,0,0,0,2,1,3,3,1,2,0,0,0,0,0],[0,0,0,0,2,1,1,1,1,1,2,0,0,0,0,0],[0,0,0,0,2,1,1,1,1,2,0,0,0,0,0,0],[0,0,0,0,0,2,1,1,2,0,0,0,0,0,0,0],[0,0,0,0,2,1,2,0,2,1,2,0,0,0,0,0],[0,0,0,0,2,2,0,0,0,2,2,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]];
      var D2=[[0,0,0,0,0,2,2,2,2,0,0,0,0,0,0,0],[0,0,0,0,2,1,1,1,1,2,0,0,0,0,0,0],[0,0,0,0,2,1,1,4,1,2,0,0,0,0,0,0],[0,0,0,0,2,1,1,1,1,2,0,0,0,0,0,0],[0,0,0,0,0,2,5,5,1,2,0,0,0,0,0,0],[0,0,0,0,0,2,1,1,2,2,0,0,2,2,0,0],[0,0,0,0,0,2,1,1,1,1,2,1,2,0,0,0],[0,0,0,0,0,2,1,3,3,1,1,2,0,0,0,0],[0,0,0,0,0,2,1,3,3,1,2,0,0,0,0,0],[0,0,0,0,0,2,1,1,1,1,1,2,0,0,0,0],[0,0,0,0,0,0,2,1,1,1,1,2,0,0,0,0],[0,0,0,0,0,0,0,2,1,1,2,0,0,0,0,0],[0,0,0,0,0,2,1,2,0,2,1,2,0,0,0,0],[0,0,0,0,0,2,2,0,0,0,2,2,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]];
      var D3=[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,2,2,2,2,0,0,0,0,0],[0,0,0,0,0,0,2,1,1,1,1,2,0,0,0,0],[0,0,0,0,0,0,2,1,4,1,1,2,0,0,0,0],[0,0,0,0,0,0,2,1,1,1,1,2,0,0,0,0],[0,0,0,0,0,0,2,1,5,5,2,0,0,0,0,0],[0,0,0,0,2,2,2,1,1,2,2,2,0,0,0,0],[0,0,0,2,1,0,2,1,3,1,0,1,2,0,0,0],[0,0,0,0,0,0,2,1,3,1,2,0,0,0,0,0],[0,0,0,0,0,2,1,1,1,1,2,0,0,0,0,0],[0,0,0,0,0,2,1,1,1,1,2,0,0,0,0,0],[0,0,0,0,0,0,2,1,1,2,0,0,0,0,0,0],[0,0,0,0,0,2,1,0,1,1,2,0,0,0,0,0],[0,0,0,0,0,2,2,0,0,2,2,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]];
      var COLORS={0:"transparent",1:"#44dd66",2:"#1a5c2a",3:"#88eea0",4:"#ffffff",5:"#ff6688"};
      var FRAMES=[IDLE,D1,D3,D2,D3,D1];
      var dancing=false,frame=0,interval=null;
      var canvas=document.getElementById("rex");
      var ctx=canvas.getContext("2d");
      var px=8;

      function draw(grid){
        ctx.clearRect(0,0,128,128);
        for(var y=0;y<16;y++) for(var x=0;x<16;x++){
          if(grid[y][x]!==0){ctx.fillStyle=COLORS[grid[y][x]];ctx.fillRect(x*px,y*px,px,px);}
        }
      }

      function toggleDance(){
        dancing=!dancing;
        var btn=document.getElementById("danceBtn");
        var n1=document.getElementById("n1"),n2=document.getElementById("n2");
        var wrap=document.getElementById("rexWrap");
        var status=document.getElementById("status");
        if(dancing){
          btn.textContent="⏹ Stop Rex";btn.className="btn stop";
          n1.style.display="block";n2.style.display="block";
          wrap.querySelector("canvas").classList.add("bouncing");
          status.textContent="Rex is vibing! 🎶";status.style.color="#44dd66";
          frame=0;draw(FRAMES[0]);
          interval=setInterval(function(){frame=(frame+1)%FRAMES.length;draw(FRAMES[frame]);},220);
        }else{
          btn.textContent="🦖 Make Rex Dance!";btn.className="btn";
          n1.style.display="none";n2.style.display="none";
          wrap.querySelector("canvas").classList.remove("bouncing");
          status.textContent="Rex is chilling...";status.style.color="#8899aa";
          clearInterval(interval);frame=0;draw(IDLE);
        }
      }

      draw(IDLE);
    </script>
  `).setWidth(280).setHeight(340);

  SpreadsheetApp.getUi().showModalDialog(html, "🦖 Rex Dance Party");
}
