import config from "./config/apiKey.js";
const CAMP_API_KEY = config.CAMP_KEY;
const KAKAO_API_KEY = config.KAKAO_KEY;

const script = document.createElement("script");
script.type = "text/javascript";
script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_API_KEY}&autoload=false`;
document.head.appendChild(script);

script.onload = () => {
  kakao.maps.load(() => {
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
    const $contents = document.getElementById("contents");
    const $listCon = document.getElementById("listCon");

    const renderSide = (el) => {
      let content = el.intro || "내용 준비중...";
      let direction = el.direction || el.addr;
      let facilInfoText = el.facilInfoText || "홈페이지 참고";
      let resveCl = el.resveCl || "홈페이지 참고";
      el.manageSttus.includes("휴장")
        ? ($manageSttus.style.color = "#ED5959")
        : ($manageSttus.style.color = "#0b75ad");
      el.pet.includes("불")
        ? ($pet.style.color = "#ED5959")
        : ($pet.style.color = "#2AC182");

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
      console.log("el", el);

      $introBtn.addEventListener("click", () => {
        if (el.homepage == "") {
          alert("홈페이지를 찾을 수 없습니다..!");
        }
      });
      $siteArr.addEventListener("click", () => {
        if (el.homepage == "") {
          alert("홈페이지를 찾을 수 없습니다..!");
        }
      });
    };

    // 이름과 위치를 담을 변수 선언.
    let positions = [];
    let map;
    let markers = []; // 모든 마커를 저장할 배열

    // 현재 위치를 가져와서 지도의 중심을 설정
    navigator.geolocation.getCurrentPosition((position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      let options = {
        // 지도를 생성할 때 필요한 기본 옵션
        center: new kakao.maps.LatLng(latitude, longitude), // 지도의 중심좌표를 현재 위치로 설정
        level: 8, // 지도의 레벨(확대, 축소 정도)
      };

      map = new kakao.maps.Map(container, options); // 지도 생성 및 객체 리턴

      // 마커 초기화.
      const deleteMaker = () => {
        currentOverlay.forEach((maker) => {
          maker.setMap(null);
        });
      };

      // 변수에 들어있는 요소들을 마커 표시
      const renderMarkers = () => {
        var imageSrc = `./img/camp1.svg`;
        var imageSize = new kakao.maps.Size(20, 20);
        var markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize);

        positions.forEach((el) => {
          var marker = new kakao.maps.Marker({
            map: map,
            position: el.latlng,
            title: el.title,
            image: markerImage,
          });
          markers.push(marker);

          var customOverlay = new kakao.maps.CustomOverlay({
            position: el.latlng,
            content: `<div class="speech-bubble-container">
                    <div class="speech-bubble">
                      <p>${el.title}</p>
                    </div>
                  </div>`,
          });

          kakao.maps.event.addListener(marker, "click", () => {
            $contents.style.cssText = "display: block";
            $listCon.style.cssText = "display: none";
            if (currentOverlay.length > 0) {
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
          url.searchParams.set("serviceKey", CAMP_API_KEY);
          url.searchParams.set("numOfRows", 1000);

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

    const listClick = (el) => {
      console.log("List click event:", el);
      // 지도를 해당 캠핑장 위치로 이동
      map.setCenter(el.latlng);
      map.setLevel(8);

      // 마커를 찾기 위한 기준 소수점 자리
      const precision = 6; // 소수점 6자리까지 비교

      // 위치 비교 함수
      const positionsAreEqual = (pos1, pos2) => {
        return (
          Math.abs(pos1.getLat() - pos2.getLat()) < Math.pow(10, -precision) &&
          Math.abs(pos1.getLng() - pos2.getLng()) < Math.pow(10, -precision)
        );
      };

      // 해당 마커를 찾아 클릭 이벤트를 트리거
      const marker = markers.find((marker) => {
        const position = marker.getPosition();
        // 위치 비교
        const isEqual = positionsAreEqual(position, el.latlng);

        return isEqual;
      });

      if (marker) {
        kakao.maps.event.trigger(marker, "click");
      } else {
        console.log("Marker not found for the given latlng:", el.latlng);
      }
    };

    const renderList = (el) => {
      const listImg = el.imgUrl == "" ? "./img/camp2.svg" : el.imgUrl;
      const $listCreate = document.createElement("li");
      const listColor = "";
      // if (el.pet.includes("불")) {
      //   listColor = "listPetTextRed";
      // } else {
      //   listColor = "listPetTextGreen";
      // }

      $listCreate.classList.add("list");
      $listCreate.innerHTML = `
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
      // 리스트 클릭 시 동작하는 이벤트 리스너 추가
      $listCreate.addEventListener("click", () => {
        listClick(el);
      });

      $lists.appendChild($listCreate);
    };

    const changeList = () => {
      $contents.style.cssText = "display: none";
      $listCon.style.cssText = "display: block";
    };

    const filterSearch = () => {
      const search = $search.value.trim();
      $lists.innerHTML = ``;
      positions.forEach((el) => {
        if (el.addr.includes(search) || el.title.includes(search)) {
          renderList(el);
        }
      });
    };

    $search.addEventListener("keyup", (e) => {
      if (e.key === "Enter") {
        filterSearch();
        changeList();
      }
    });
    document.getElementById("searchIcon").addEventListener("click", () => {
      filterSearch();
      changeList();
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
  });
};
