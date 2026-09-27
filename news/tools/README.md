# 달빛 오락실 소식 페이지 만들기

`news/` 의 페이지는 손으로 쓰지 않고 이 도구로 만든다.

- `posts.py` — 소식 글. **새 소식은 POSTS 맨 위에 더한다.** 분류는 new(새 게임) / update(업데이트) / story(만드는 이야기)
- `build_news.py` — `python3 build_news.py 출력폴더` 로 목록(index.html), 글마다 폴더, news.json 을 만든다
- `news.css` — 소식 페이지 모양 (`/intro/intro.css` 위에 더함)
- `banner.js` — 대문의 「📰 새 소식」 알림 띠. news.json 맨 위 소식을 게임기 줄 위에 한 줄로 보여 준다. ✕로 닫으면 작은 「📰 소식」 단추만 남고, 새 소식이 올라오면 다시 뜬다

## 대문에 연결하는 법 (처음 한 번)
대문 `index.html` 의 `</body>` 바로 앞에 한 줄: `<script src="news/banner.js" defer></script>`

## 지키는 것
- 블로그·교실·수업이라는 말은 쓰지 않는다. 정답·범인·결말도 쓰지 않는다
- 그림은 서버에 이미 있는 소개 화면 그림(`/intro/<게임>/shot*.webp`, `og.jpg`)을 쓴다
