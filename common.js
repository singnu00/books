/*
  우리 반 책장 - 공통 스크립트
  index.html, login.html, signup.html, mypage.html 에서 함께 사용해요.
*/

const LS_BOOKS = 'rk_books';
const LS_FAV = 'rk_favorites';
const LS_PW = 'rk_admin_pw';               // 관리자 비밀번호
const LS_STUDENT_PW = 'rk_student_pw';     // (예전 공용 비밀번호 - 이제는 개인별 비밀번호를 우선 사용해요)
const LS_MEMBERS = 'rk_members';           // 회원(학생/선생님) 목록
const LS_LOGGED_IN = 'rk_logged_in';       // 관리자 로그인 여부
const LS_CURRENT_MEMBER = 'rk_current_member'; // 지금 로그인한 학생/선생님 (세션 정보만 저장)
const LS_MEMBER_SEED_VERSION = 'rk_member_seed_version';

const DEFAULT_ADMIN_PW = '1357';
const DEFAULT_STUDENT_PW = '0000'; // 회원가입/명단 등록 시 기본 비밀번호. 각자 마이페이지에서 바꿀 수 있어요.

// 반 학생·선생님 명단 (틀린 부분 있으면 관리자 모드 "회원가입 승인"에서 고치거나 알려주세요)
const SEED_MEMBERS = [
  {id:'11001', name:'고세아', role:'student'},
  {id:'11002', name:'김나연', role:'student'},
  {id:'11003', name:'김도연', role:'student'},
  {id:'11004', name:'김린', role:'student'},
  {id:'11005', name:'김민지', role:'student'},
  {id:'11006', name:'김세영', role:'student'},
  {id:'11007', name:'김제희', role:'student'},
  {id:'11008', name:'김주하', role:'student'},
  {id:'11009', name:'박애리', role:'student'},
  {id:'11010', name:'석예원', role:'student'},
  {id:'11011', name:'송경휘', role:'student'},
  {id:'11012', name:'이수민', role:'student'},
  {id:'11013', name:'이시은', role:'student'},
  {id:'11014', name:'이예린', role:'student'},
  {id:'11015', name:'이은채', role:'student'},
  {id:'11016', name:'이지수', role:'student'},
  {id:'11017', name:'임주이', role:'student'},
  {id:'11018', name:'장연주', role:'student'},
  {id:'11019', name:'정다감', role:'student'},
  {id:'11020', name:'정서현', role:'student'},
  {id:'11021', name:'조서윤', role:'student'},
  {id:'11022', name:'조윤서', role:'student'},
  {id:'11023', name:'조윤아', role:'student'},
  {id:'11024', name:'최아영', role:'student'},
  {id:'11025', name:'최연지', role:'student'},
  {id:'11026', name:'홍민아', role:'student'},
  {id:'11027', name:'황희윤', role:'student'},
  {id:'', name:'문선영', role:'teacher'}
];
const MEMBER_SEED_VERSION = 'v1'; // 명단을 다시 반영하고 싶으면 이 값을 바꿔주세요 (예: 'v2')

(function seedDefaults(){
  try{
    if(!localStorage.getItem(LS_PW)) localStorage.setItem(LS_PW, DEFAULT_ADMIN_PW);
    if(!localStorage.getItem(LS_STUDENT_PW)) localStorage.setItem(LS_STUDENT_PW, DEFAULT_STUDENT_PW);
    if(!localStorage.getItem(LS_MEMBERS)) localStorage.setItem(LS_MEMBERS, JSON.stringify([]));
  }catch(e){}
})();

const LS_POSTS = 'rk_posts'; // 게시판 글

function loadPosts(){
  try{ const raw = localStorage.getItem(LS_POSTS); if(raw) return JSON.parse(raw); }catch(e){}
  return [];
}
function savePosts(list){
  try{ localStorage.setItem(LS_POSTS, JSON.stringify(list)); }catch(e){}
}
// 지금 이 화면을 볼 수 있는 사람인지 확인하고, 아니면 로그인 페이지로 보내요.
// 책장/게시판처럼 "로그인 후 이용 가능"한 페이지 맨 위에서 호출해서 써요.
function requireLogin(){
  const isAdmin = localStorage.getItem(LS_LOGGED_IN) === 'true';
  const member = getCurrentMemberFull();
  if(!isAdmin && !member){
    location.href = 'login.html';
    return null;
  }
  return { isAdmin, member };
}

function loadMembers(){
  try{ const raw = localStorage.getItem(LS_MEMBERS); if(raw) return JSON.parse(raw); }catch(e){}
  return [];
}
function saveMembers(list){
  try{ localStorage.setItem(LS_MEMBERS, JSON.stringify(list)); }catch(e){}
}

// 명단(SEED_MEMBERS)에 있는데 아직 등록 안 된 사람만 추가해요. 이미 있는 사람은 건드리지 않아요.
(function seedMembers(){
  try{
    if(localStorage.getItem(LS_MEMBER_SEED_VERSION) === MEMBER_SEED_VERSION) return;
    const members = loadMembers();
    SEED_MEMBERS.forEach(sm=>{
      const exists = members.some(m => m.role === sm.role && m.name === sm.name && (sm.role === 'teacher' || m.id === sm.id));
      if(!exists){
        members.push({
          id: sm.id,
          name: sm.name,
          role: sm.role,
          approved: true,
          password: DEFAULT_STUDENT_PW,
          nickname: sm.name,
          photo: '',
          createdAt: Date.now()
        });
      }
    });
    saveMembers(members);
    localStorage.setItem(LS_MEMBER_SEED_VERSION, MEMBER_SEED_VERSION);
  }catch(e){}
})();

function findApprovedMember(role, name, id){
  return loadMembers().find(m => m.approved && m.role === role && m.name === name && (role === 'teacher' || m.id === id));
}
function findExistingApplicant(role, name, id){
  return loadMembers().find(m => m.role === role && m.name === name && (role === 'teacher' || m.id === id));
}

/* ---------- 로그인 세션 (가벼운 정보만 저장, 실제 값은 항상 명단에서 다시 조회) ---------- */
function getCurrentMember(){
  try{ const raw = localStorage.getItem(LS_CURRENT_MEMBER); if(raw) return JSON.parse(raw); }catch(e){}
  return null;
}
function setCurrentMember(session){
  try{ localStorage.setItem(LS_CURRENT_MEMBER, JSON.stringify(session)); }catch(e){}
}
function clearCurrentMember(){
  try{ localStorage.removeItem(LS_CURRENT_MEMBER); }catch(e){}
}
// 로그인한 사람의 최신 전체 정보(비밀번호, 사진, 닉네임 포함)를 명단에서 다시 찾아줘요.
function getCurrentMemberFull(){
  const session = getCurrentMember();
  if(!session) return null;
  return loadMembers().find(m => m.role === session.role && m.name === session.name && (m.role === 'teacher' || m.id === session.id)) || null;
}
// 로그인한 사람 본인의 정보를 수정할 때 사용해요 (닉네임, 비밀번호, 사진 등).
// 필요한 칸을 다 채우면 버튼이 진하게(활성) 바뀌도록 도와주는 함수.
// checkFn: 지금 버튼을 눌러도 되는 상태인지 true/false로 알려주는 함수
// watchEls: 입력값이 바뀔 때마다 다시 확인할 input/select/textarea 요소들
function wireReadyButton(btn, checkFn, watchEls){
  const update = ()=>{
    const ready = !!checkFn();
    btn.disabled = !ready;
    btn.classList.toggle('is-ready', ready);
  };
  (watchEls || []).forEach(el=>{
    if(!el) return;
    el.addEventListener('input', update);
    el.addEventListener('change', update);
  });
  update();
  return update;
}

