import KAKAO_KEY from "./config/apiKey.js";
const API_KEY = KAKAO_KEY;

const url = new URL(
  `https://apis.data.go.kr/B551011/GoCamping/basedList?MobileOS=ETC&MobileApp=testAPP&_type=json`
);

let container = document.getElementById("map"); // 지도를 담을 영역의 DOM 레퍼런스
let currentOverlay = [];
// ------------------------------------------------------------
const $roadInfoText = document.getElementById("roadInfoText");
const $arrowIcon = document.querySelector(".arrowIcon");
const $facilInfoText = document.getElementById("facilInfoText");
const $arrowFacilIcon = document.querySelector(".arrowFacilIcon");
// --------------------------------------------------------------
const $campName = document.getElementById("campName"); //캠핑장 이름
const $campImg = document.getElementById("campImg"); // 캠핌장 사진
const $topText = document.getElementById("topText"); // 캠핑장 주소
const $bottomText = document.getElementById("bottomText"); // 캠핑장 소개
const $introBtn = document.getElementById("introBtn"); // 캠핑장 클릭시 홈페이지 이동.
const $siteArr = document.getElementById("siteArr");
const $manageSttus = document.getElementById("manageSttus"); // 운영상태
// const $roadInfoText = document.getElementById("roadInfoText"); // 오시는 길
const $resveCl = document.getElementById("resveCl"); //예약방법
// const $facilInfoText = document.getElementById("facilInfoText"); // 내부시설
const $pet = document.getElementById("pet");

const renderSide = (el) => {
  let content = el.intro || "내용 준비중...";
  let direction = el.direction || el.addr;
  let facilInfoText = el.facilInfoText || "홈페이지 참고";
  let resveCl = el.resveCl || "홈페이지 참고";
  el.pet.includes("불")
    ? ($pet.style.color = "#ED5959")
    : ($pet.style.color = "#2AC182");
  console.log(el);

  $introBtn.href = el.homepage;
  $campName.textContent = el.title;
  $campImg.src = el.imgUrl;
  $topText.textContent = el.addr;
  $bottomText.textContent = content;

  $siteArr.href = el.homepage;
  $manageSttus.textContent = el.manageSttus;
  $roadInfoText.textContent = direction;
  $resveCl.textContent = resveCl;
  $facilInfoText.textContent = facilInfoText;
  $pet.textContent = el.pet;
};

// 이름과 위치를 담을 변수 선언.
let positions = [];

// 현재 위치를 가져와서 지도의 중심을 설정
navigator.geolocation.getCurrentPosition((position) => {
  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;

  let options = {
    // 지도를 생성할 때 필요한 기본 옵션
    center: new kakao.maps.LatLng(latitude, longitude), // 지도의 중심좌표를 현재 위치로 설정
    level: 8, // 지도의 레벨(확대, 축소 정도)
  };

  let map = new kakao.maps.Map(container, options); // 지도 생성 및 객체 리턴

  // 마커 초기화.
  const deleteMaker = () => {
    currentOverlay.forEach((maker) => {
      maker.setMap(null);
    });
  };

  // 변수에 들어있는 요소들을 마커 표시
  const renderMarkers = () => {
    console.log(positions);

    var imageSrc = `./img/camp1.svg`;
    // "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png";

    positions.forEach((el) => {
      var imageSize = new kakao.maps.Size(20, 20); // 마커 이미지의 이미지 크기
      var markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize); // 마커 이미지를 생성

      var overlay = `<div class="speech-bubble-container">
                      <div class="speech-bubble">
                        <p>${el.title}</p> <!-- 또는 다른 내용 -->
                      </div>
                    </div>`; // 인포윈도우에 표출될 내용으로 HTML 문자열이나 document element가 가능합니다

      var marker = new kakao.maps.Marker({
        map: map, // 마커를 표시할 지도
        position: el.latlng, // 마커를 표시할 위치
        title: el.title, // 마커의 타이틀
        image: markerImage, // 마커 이미지
      });

      // 마커의 디자인과 위치를 변수에 저장.
      var customOverlay = new kakao.maps.CustomOverlay({
        position: el.latlng,
        content: overlay,
      });

      kakao.maps.event.addListener(marker, "click", () => {
        if (!currentOverlay.length == 0) {
          deleteMaker(); // 기존 마커를 지도에서 제거.
        }
        renderSide(el);
        currentOverlay.push(customOverlay);
        map.setCenter(marker.getPosition());
        map.setLevel(8);
        customOverlay.setMap(map);
      });
    });
  };

  const positionList = (items) => {
    console.log(items);
    items.forEach((item) => {
      let LatLng = new kakao.maps.LatLng(item.mapY, item.mapX);
      let position = {
        imgUrl: item.firstImageUrl,
        addr: item.addr1,
        title: item.facltNm,
        latlng: LatLng,
        homepage: item.homepage,
        manageSttus: item.manageSttus,
        intro: item.intro,
        resveCl: item.resveCl,
        caravInnerFclty: item.caravInnerFclty,
        pet: item.animalCmgCl,
        direction: item.direction,
      };
      positions.push(position);
    });
    renderMarkers();
  };

  const fetchMaps = async () => {
    try {
      url.searchParams.set("serviceKey", API_KEY);
      url.searchParams.set("numOfRows", 100);
      console.log(url);

      const res = await fetch(url);
      const data = await res.json();
      const items = await data.response.body.items.item;
      positionList(items);
    } catch (error) {
      console.log(error);
    }
  };
  fetchMaps();
});

// ------------------------------------------------------------------------------------------------
// 왼쪽 side 영역

const $search = document.getElementById("search");
const $lists = document.getElementById("lists");
const $listPetText = document.querySelector("listPetText");
const renderList = (el) => {
  console.log("render", el);
  const listImg = el.imgUrl == "" ? "./img/camp2.svg" : el.imgUrl;
  const $listArr = document.createElement("li");
  const listColor = "";
  // if (el.pet.includes("불")) {
  //   listColor = "listPetTextRed";
  // } else {
  //   listColor = "listPetTextGreen";
  // }

  $listArr.classList.add("list");
  $listArr.innerHTML = `
                <div class="listContent">
                  <div class="listImg">
                    <img src="${listImg}" alt="캠핑이미지" />
                  </div>
                  <div class="listInfos">
                    <div class="listTitle">
                      <p>${el.title}</p>
                    </div>
                    <div class="listInfo">
                      <p>${el.addr}</p>
                      <p>상태 : ${el.manageSttus}</p>
                     
                      <p class="listPet">반려견 : <span class=${listColor}>${el.pet}</span></p>
                    </div>
                  </div>
                </div>
  `;
  $lists.appendChild($listArr);
};

const filterSearch = () => {
  const search = $search.value.trim();
  $lists.innerHTML = ``;
  positions.forEach((el) => {
    if (el.addr.includes(search) || el.title.includes(search)) {
      console.log(el);
      renderList(el);
    }
  });
};

$search.addEventListener("keyup", (e) => {
  if (e.key === "Enter") {
    filterSearch();
  }
});
// ------------- 아래 화살표 --------------------
$roadInfoText.addEventListener("click", () => {
  $roadInfoText.classList.toggle("expanded");
  $arrowIcon.classList.toggle("rotated");
});

$facilInfoText.addEventListener("click", () => {
  $facilInfoText.classList.toggle("clicked");
  $arrowFacilIcon.classList.toggle("rotated");
});
