document.addEventListener('DOMContentLoaded', function() {
  // URL에서 현재 페이지 번호 가져오기
  const urlParams = new URLSearchParams(window.location.search);
  const currentPage = parseInt(urlParams.get('page')) || 1;

  // 페이지네이션 링크 클릭 이벤트 처리
  document.querySelectorAll('.pagination .page-link').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const href = this.getAttribute('href');
      window.location.href = href;
    });
  });
}); 