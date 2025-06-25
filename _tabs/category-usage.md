---
title: Category Usage
layout: page
icon: fas fa-info-circle
order: 8
---

# 카테고리 레이아웃 사용법

이 블로그에서 사용할 수 있는 카테고리 필터링 레이아웃들의 사용법을 안내합니다.

## 1. category-filter 레이아웃

특정 카테고리의 포스트만 필터링하여 표시하는 레이아웃입니다.

### 기본 사용법

```yaml
---
title: "Database Posts"
layout: category-filter
filter_category: "Database"
---
```

### 고급 사용법

```yaml
---
title: "PostgreSQL Guide"
layout: category-filter
filter_categories: ["Database", "PostgreSQL"]  # 여러 카테고리 모두 포함
exclude_categories: ["Example"]               # 특정 카테고리 제외
max_posts: 20                                # 최대 포스트 수 제한
---
```

## 2. category-widget 레이아웃

여러 카테고리를 위젯 형태로 표시하는 레이아웃입니다.

### 기본 사용법

```yaml
---
title: "Categories Overview"
layout: category-widget
show_all_categories: true    # 모든 카테고리 표시
posts_per_category: 3        # 카테고리당 표시할 포스트 수
---
```

### 특정 카테고리만 표시

```yaml
---
title: "Main Categories"
layout: category-widget
widget_categories: ["Database", "Blog", "Tutorial"]
posts_per_category: 5
---
```

## 3. category-posts Include 컴포넌트

다른 페이지에서 카테고리 포스트를 포함시킬 때 사용하는 컴포넌트입니다.

### 기본 사용법

```liquid
{% raw %}{% include category-posts.html category="Database" limit=5 %}{% endraw %}
```

### 다양한 스타일

#### Simple 스타일 (기본값)
```liquid
{% raw %}{% include category-posts.html category="PostgreSQL" limit=10 style="simple" %}{% endraw %}
```

#### Compact 스타일
```liquid
{% raw %}{% include category-posts.html categories="Database,PostgreSQL" limit=6 style="compact" %}{% endraw %}
```

#### Detailed 스타일
```liquid
{% raw %}{% include category-posts.html category="Database" limit=3 style="detailed" %}{% endraw %}
```

## CSS 관리

모든 카테고리 레이아웃의 스타일은 `_sass/pages/_category-layouts.scss` 파일에서 관리됩니다.

```scss
/* 예시: 카테고리 필터 스타일 커스터마이징 */
#page-category-filter {
  .post-title {
    font-weight: 600; /* 기본값 500에서 변경 */
  }
}
```

## 매개변수 설명

### category-filter 레이아웃
- `filter_category`: 단일 카테고리명
- `filter_categories`: 여러 카테고리 배열 (모두 포함되어야 함)
- `exclude_categories`: 제외할 카테고리 배열
- `max_posts`: 최대 포스트 수

### category-widget 레이아웃
- `widget_categories`: 표시할 카테고리 배열
- `show_all_categories`: 모든 카테고리 표시 여부
- `posts_per_category`: 카테고리당 포스트 수

### category-posts Include
- `category`: 단일 카테고리명
- `categories`: 여러 카테고리 (쉼표로 구분된 문자열)
- `exclude`: 제외할 카테고리 (쉼표로 구분된 문자열)
- `limit`: 표시할 포스트 수
- `style`: 표시 스타일 ("simple", "compact", "detailed")
- `show_categories`: 카테고리 뱃지 표시 여부
- `show_date`: 날짜 표시 여부

---

## 예시 결과

### Database 카테고리 포스트 미리보기 (Compact 스타일)

{% include category-posts.html category="Database" limit=4 style="compact" %}

### PostgreSQL 관련 포스트 (Simple 스타일)

{% include category-posts.html categories="Database,PostgreSQL" limit=5 style="simple" %} 