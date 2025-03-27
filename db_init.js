const sqlite3 = require('sqlite3').verbose();
const xlsx = require('xlsx');
const fs = require('fs');

// 엑셀 파일 읽기
const workbook = xlsx.readFile('movies.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(worksheet);

// SQLite3 데이터베이스 생성
const db = new sqlite3.Database('movies.db');

db.serialize(() => {
    // 테이블 생성
    db.run(`
        CREATE TABLE IF NOT EXISTS movies (
            id INTEGER PRIMARY KEY,
            title TEXT,
            original_title TEXT,
            overview TEXT,
            release_date TEXT,
            poster_path TEXT,
            backdrop_path TEXT,
            popularity REAL,
            vote_average REAL,
            vote_count INTEGER,
            genre_ids TEXT
        )
    `);

    // 데이터 삽입
    const stmt = db.prepare(`
        INSERT INTO movies (id, title, original_title, overview, release_date, poster_path, backdrop_path, popularity, vote_average, vote_count, genre_ids)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    data.forEach(row => {
        stmt.run(
            row.ID,
            row.Title,
            row["Original Title"],
            row.Overview,
            row["Release Date"],
            row["Poster Path"],
            row["Backdrop Path"],
            row.Popularity,
            row["Vote Average"],
            row["Vote Count"],
            JSON.stringify(row["Genre IDs"])
        );
    });

    stmt.finalize();
});

db.close();
