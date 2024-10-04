# Node.js 게시판

이 프로젝트는 **Node.js (Express)**와 **MariaDB**를 기반으로 구현된 간단한 게시판 시스템입니다. 사용자는 글을 작성하고, 수정 및 삭제할 수 있으며 댓글 기능도 포함되어 있습니다. 이 프로젝트는 기존에 PHP로 구현된 [php-board](https://github.com/BlueShareHub/php-board)를 Node.js로 변환한 것입니다.

<br>

## 설치 방법

1. 프로젝트를 클론합니다.

``` bash
git clone https://github.com/BlueShareHub/node-board.git
```

2. 클론한 프로젝트의 폴더 구조는 다음과 같습니다.

```
/ (프로젝트 루트)
├── config/              # 환경설정 관련 파일 (예: DB 연결 설정)
│   └── db.js            # 데이터베이스 연결 설정 파일
├── node_modules/        # Node.js 패키지 폴더 (npm install 후 자동 생성)
├── views/               # EJS 템플릿 파일
│   └── list.ejs         # 게시글 목록 템플릿
│   └── view.ejs         # 게시글 상세보기 템플릿
│   └── write.ejs        # 게시글 작성 템플릿
│   └── edit.ejs         # 게시글 수정 템플릿
├── .env                 # 환경 변수 파일 (비공개, Git에 포함되지 않음)
├── app.js               # 애플리케이션 엔트리 포인트
├── package-lock.json
└── package.json         # npm 설정 파일
```

3. `.env.example` 파일을 참고하여 `.env` 파일을 생성하고, 데이터베이스 정보와 관리자 비밀번호를 설정합니다.

4. 데이터베이스 테이블을 생성합니다. 아래의 SQL 쿼리를 사용하여 MariaDB에 테이블을 생성합니다.

``` sql
-- 게시판 테이블
CREATE TABLE php_board (
  id INT AUTO_INCREMENT PRIMARY KEY,    -- 게시글 ID (자동 증가, 기본 키)
  title VARCHAR(255) NOT NULL,          -- 게시글 제목
  content TEXT NOT NULL,                -- 게시글 내용
  author VARCHAR(100) NOT NULL,         -- 작성자 이름
  password_hash VARCHAR(255) NOT NULL,  -- 비밀번호 해시값
  views INT DEFAULT 0,                  -- 조회수 (기본값: 0)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 게시글 작성 시간 (자동 현재 시간)
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- 게시글 수정 시간 (자동 업데이트)
);

-- 댓글 테이블
CREATE TABLE php_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,    -- 댓글 ID (자동 증가, 기본 키)
  post_id INT NOT NULL,                 -- 게시글 ID (php_board 테이블과 외래 키 관계)
  content TEXT NOT NULL,                -- 댓글 내용
  author VARCHAR(100) NOT NULL,         -- 댓글 작성자 이름
  password_hash VARCHAR(255) NOT NULL,  -- 댓글 비밀번호 해시값
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 댓글 작성 시간 (자동 현재 시간)
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- 댓글 수정 시간 (자동 업데이트)
  
  -- php_board 테이블의 id 필드와 외래 키 관계 설정, 게시글이 삭제되면 연결된 댓글도 삭제됨
  FOREIGN KEY (post_id) REFERENCES php_board(id) ON DELETE CASCADE
);
```

5. Node.js 서버를 실행하기 위해 필요한 패키지를 설치합니다. 프로젝트의 루트 디렉토리에서 다음 명령을 실행하여 의존성을 설치합니다..

```
npm install
```

6. 서버를 실행합니다.

```
npm start
```

7. 이제 브라우저에서 `http://localhost:3000/board/list`를 열어 게시판을 확인할 수 있습니다.

※ 적용된 게시판 페이지 예시: [https://bluesharehub.com/board/list.php?access=blueshare_board](https://bluesharehub.com/board/list.php?access=blueshare_board)

<br>

## 사용 방법

- **글 작성**: 게시판에서 '글쓰기' 버튼을 클릭하여 글을 작성할 수 있습니다.
- **댓글 작성**: 각 게시글 하단에서 댓글을 작성할 수 있습니다.
- **글 수정 및 삭제**: 작성한 글을 수정하거나 삭제하려면 작성 시 입력한 비밀번호를 입력해야 합니다.

<br>

## 라이센스

이 프로젝트는 [MIT 라이센스](LICENSE)를 따릅니다.
