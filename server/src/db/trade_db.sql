-- database 생성
DROP DATABASE IF EXISTS trade_db;
CREATE DATABASE trade_db;

USE trade_db;

-- table 생성
-- DROP TABLE IF EXISTS user;
-- CREATE TABLE user (
--     user_idx int(11) unsigned NOT NULL AUTO_INCREMENT,
--     login_tk varchar(64) NOT NULL,
--     nickname varchar(32) NOT NULL,
--     sk_enc  varchar(64) NOT NULL,
--     pk_own varchar(64) NOT NULL,
--     pk_enc varchar(64) NOT NULL,
--     addr varchar(64) NOT NULL,
--     eoa_addr varchar(64) NOT NULL,
--     PRIMARY KEY (user_idx),
--     UNIQUE (login_tk),
--     UNIQUE (nickname)
-- );
-- 원래 user에 추가해야함.
-- UNIQUE (eoa_addr)

-- 구매기록  

DROP TABLE IF EXISTS data;
CREATE TABLE data (
    data_idx int(11) unsigned NOT NULL AUTO_INCREMENT,
    title varchar(64) NOT NULL,
    descript text(1000),
    author varchar(32) NOT NULL,
    pk_own varchar(64) ,
    addr_ varchar(64) NOT NULL,
    sk_enc varchar(64) NOT NULL,
    pk_enc varchar(64) ,
    eoa varchar(64) NOT NULL,
    h_k varchar(64) NOT NULL,
    h_ct varchar(64) NOT NULL,
    h_data varchar(64),
    fee varchar(64) NOT NULL,
    enc_key varchar(64) NOT NULL,
    data_path varchar(255) NOT NULL,
    cover_path varchar(255),
    UNIQUE(h_data),
    PRIMARY KEY (data_idx)
);

--                 note_idx,
--                 open_key,
--                 bal,
--                 user_addr,
--                 cm,
--                 tokenAddress,
--                 type,
--                 sk_enc : 누구 것인지 식별하기 위해서
DROP TABLE IF EXISTS notes;
CREATE TABLE notes (
    note_idx varchar(64) UNIQUE NOT NULL,
    sk_enc varchar(64) NOT NULL,
    open_key varchar(64) NOT NULL,
    user_addr varchar(64) NOT NULL,
    bal varchar(64) NOT NULL,
    cm varchar(64)  NOT NULL,
    tokenAddress varchar(64) NOT NULL,
    is_read INT(1)
);

DROP TABLE IF EXISTS trade;
CREATE TABLE trade (
    buyer_addr varchar(64) NOT NULL,
    buyer_sk varchar(64),
    buyer_pk varchar(64),
    title varchar(64) NOT NULL,
    h_k varchar(64) NOT NULL
);


-- default data 추가
-- DECLARE @DefaultID varchar(30);

-- INSERT INTO user (id, pw) VALUES (@DefaultID, @DefaultID);


-- 계정 권한 추가
USE mysql;
create user IF NOT EXISTS 'dataTradeServer'@'localhost' identified by 'Itsp7501`';
FLUSH privileges;

GRANT ALL privileges ON `trade_db`.* TO 'dataTradeServer'@'localhost';
