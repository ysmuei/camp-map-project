import config from "./config/apiKey.js";
// const CAMP_API_KEY = config.CAMP_KEY;
// const KAKAO_API_KEY = config.KAKAO_KEY;
const CAMP_API_KEY = process.env.CAMP_KEY;
const KAKAO_API_KEY = process.env.KAKAO_KEY;

const script = document.createElement("script");
script.type = "text/javascript";
script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_API_KEY}&autoload=false`;
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
    const spinner = document.getElementById("spinner");

    const showSpinner = () => {
      spinner.style.display = "block"; // 스피너 표시
    };
    const hideSpinner = () => {
      spinner.style.display = "none"; // 스피너 숨기기
    };

    const renderSide = (el) => {
      console.log(el);

      let content = el.intro || "내용 준비중...";
      let direction = el.direction || el.addr;
      let facilInfoText = el.facilInfoText || "홈페이지 참고";
      let resveCl = el.resveCl || "홈페이지 참고";
      let campImg = el.imgUrl ? el.imgUrl : "./img/basic_camp.svg";
      if (!el.imgUrl) {
        $campImg.classList.add("basic");
      } else {
        $campImg.classList.remove("basic");
      }
      el.manageSttus.includes("휴장")
        ? ($manageSttus.style.color = "#ED5959")
        : ($manageSttus.style.color = "#0b75ad");
      el.pet.includes("불")
        ? ($pet.style.color = "#ED5959")
        : ($pet.style.color = "#2AC182");

      $introBtn.href = el.homepage;
      $campName.textContent = el.title;
      $campImg.src = campImg;
      $topText.textContent = el.addr;
      $bottomText.textContent = content;

      $siteArr.href = el.homepage;
      $manageSttus.textContent = el.manageSttus;
      $roadInfoText.textContent = direction;
      $resveCl.textContent = resveCl;
      $facilInfoText.textContent = facilInfoText;
      $pet.textContent = el.pet;

      // 새로 이벤트 리스너 추가 (once 옵션 사용)
      const siteBtnClick = (event) => {
        if (!el.homepage) {
          alert("홈페이지를 찾을 수 없습니다..!");
          event.preventDefault();
          return;
        }
      };
      // 기존 이벤트 리스너 제거
      $introBtn.removeEventListener("click", siteBtnClick);
      $siteArr.removeEventListener("click", siteBtnClick);

      $introBtn.addEventListener("click", siteBtnClick, { once: true });
      $siteArr.addEventListener("click", siteBtnClick, { once: true });
    };

    // 이름과 위치를 담을 변수 선언.
    let firstList = []; // 가까운 20개의 캠핑장 정보를 저장할 배열
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

      // 지도 레벨에 따라 마커 이미지 업데이트 함수
      const updateMarkerImageBasedOnLevel = () => {
        const level = map.getLevel();
        let imageSrc;
        let imageSize;
        if (level <= 5) {
          imageSrc = "./img/camp1.svg"; // 높은 줌 레벨 이미지
          imageSize = new kakao.maps.Size(25, 25);
        } else if (level <= 8) {
          imageSrc = "./img/camp1.svg"; // 높은 줌 레벨 이미지
          imageSize = new kakao.maps.Size(20, 20);
        } else if (level <= 11) {
          imageSrc = "./img/camp_blue.svg"; // 낮은 줌 레벨 이미지
          imageSize = new kakao.maps.Size(15, 15);
        } else {
          imageSrc = "./img/camp_blue.svg"; // 낮은 줌 레벨 이미지
          imageSize = new kakao.maps.Size(8, 8);
        }
        const markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize);
        markers.forEach((marker) => {
          marker.setImage(markerImage);
        });
      };

      // 지도 레벨 변경 이벤트 리스너 추가
      kakao.maps.event.addListener(map, "zoom_changed", () => {
        updateMarkerImageBasedOnLevel();
      });

      function getDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a =
          0.5 -
          Math.cos(dLat) / 2 +
          (Math.cos(lat1 * (Math.PI / 180)) *
            Math.cos(lat2 * (Math.PI / 180)) *
            (1 - Math.cos(dLon))) /
            2;
        return R * 2 * Math.asin(Math.sqrt(a));
      }

      function getClosestCampsites(
        campsites,
        currentLat,
        currentLng,
        count = 20
      ) {
        return campsites
          .map((campsite) => ({
            ...campsite,
            distance: getDistance(
              currentLat,
              currentLng,
              campsite.latlng.getLat(),
              campsite.latlng.getLng()
            ),
          }))
          .sort((a, b) => a.distance - b.distance)
          .slice(0, count);
      }

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

            map.panTo(marker.getPosition());
            customOverlay.setMap(map);
          });
        });
        updateMarkerImageBasedOnLevel();
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

      const renderFirstList = () => {
        // `firstList`의 항목들을 렌더링
        $lists.innerHTML = ""; // 기존 리스트 초기화
        firstList.forEach((el) => {
          renderList(el);
        });
      };

      const fetchMaps = async () => {
        try {
          showSpinner(); // 데이터 로딩 스피너 출력.
          url.searchParams.set("serviceKey", CAMP_API_KEY);
          url.searchParams.set("numOfRows", 1000);

          const res = await fetch(url);
          const data = await res.json();
          const items = await data.response.body.items.item;
          positionList(items);
          // 현재 위치를 기준으로 가장 가까운 20개의 캠핑장 정보
          const closestCampsites = getClosestCampsites(
            positions,
            latitude,
            longitude
          );
          firstList = closestCampsites;
          renderFirstList(); // 내 주변 캠핑장 목록에 캠핑장 추가
        } catch (error) {
          console.log(error);
        } finally {
          hideSpinner(); // 데이터 로딩 완료 시 스피너 숨기기
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
        console.log("주어진 위치의 마커를 찾을 수 없습니다.:", el.latlng);
      }
    };

    const renderList = (el) => {
      const listImg = el.imgUrl == "" ? "./img/basic_camp.svg" : el.imgUrl;
      const $listCreate = document.createElement("li");
      let listCurr = "";
      let listColor = "";
      if (el.pet.includes("불")) {
        listColor = "listPetTextRed";
      } else {
        listColor = "listPetTextGreen";
      }
      el.manageSttus.includes("휴장")
        ? (listCurr = "listCurrRed")
        : (listCurr = "listCurrgreen");
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
                        <p>상태 : <span class="${listCurr}">${el.manageSttus}</span></p>
                       
                        <p class="listPet">반려견 : <span class="${listColor}">${el.pet}</span></p>
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
        if ($search.value.trim() == "") {
          alert("캠핑장을 입력해 주세요!");
          return;
        }
        filterSearch();
        changeList();
      }
    });
    document.getElementById("searchIcon").addEventListener("click", () => {
      if ($search.value.trim() == "") {
        alert("캠핑장을 입력해 주세요!");
        return;
      }
      filterSearch();
      changeList();
    });

    // ------------- 아래 화살표 --------------------
    // $roadInfoText.addEventListener("click", () => {
    //   $roadInfoText.classList.toggle("expanded");
    //   $arrowIcon.classList.toggle("rotated");
    // });

    // $facilInfoText.addEventListener("click", () => {
    //   $facilInfoText.classList.toggle("clicked");
    //   $arrowFacilIcon.classList.toggle("rotated");
    // });
  });
};
