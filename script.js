document.addEventListener('DOMContentLoaded', function() {
    // 1. 導覽列自動高亮當前頁面邏輯
    const currentPage = location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('nav ul li a');
    
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // 2. 首頁邏輯：點擊季節卡片
    const seasonCards = document.querySelectorAll('.season-card');
    seasonCards.forEach(card => {
        card.addEventListener('click', function() {
            const seasonValue = this.getAttribute('data-season');
            localStorage.setItem('trip_season', seasonValue); // 儲存季節
            window.location.href = 'map.html'; // 前往地圖頁
        });
    });
// 3. 地圖頁邏輯：動態渲染地圖標點與側邊景點清單 (結合手稿設計)
    const currentSeasonSpan = document.getElementById('current-season');
    if (currentSeasonSpan) {
        const savedSeason = localStorage.getItem('trip_season') || '春季 (Spring)';
        currentSeasonSpan.innerText = savedSeason;
    }

    // 景點結構化資料庫 (包含各景點於 image_d1e001.jpg 底圖中的估計坐標百分比)
    const seasonalData = {
        "春季 (Spring)": [
            { name: "螢火蟲賞螢點", icon: "", x: 65, y: 53, desc: "春季限定！漫步在溪流與竹林間尋找閃爍的綠色精靈，體驗浪漫的夜間生態環境。" },
            { name: "採茶體驗區", icon: "", x: 60, y: 76, desc: "親自戴上斗笠、背起茶簍，走入茶園體驗採摘新鮮一心二葉的茶農生活。" },
            { name: "竹藝文化坊", icon: " baskets", icon: "", x: 44, y: 35, desc: "深入認識在地珍貴的竹藝文化，並在職人指導下動手製作專屬傳統竹編物品。" },
            { name: "竹筒飯體驗", icon: "", x: 53, y: 39, desc: "品嚐使用新鮮孟宗竹包裹糯米與在地食材、經過柴火慢烘的傳統在地風味美食。" }
        ],
        "夏季 (Summer)": [
            { name: "德興瀑布", icon: "", x: 50, y: 61, desc: "避暑絕佳去處！瀑布雙層傾瀉而下，四周水氣氤氳、清涼透心，十分消暑。" },
            { name: "孟宗竹林古戰場", icon: "", x: 60, y: 43, desc: "走進媲美京都嵐山的翠綠竹林風情，慢步古戰場步道，感受與世隔絕的靜謐。" },
            { name: "手作愛玉體驗", icon: "", x: 48, y: 37, desc: "盛夏消暑良伴！親手搓揉天然愛玉子，搭配小半天在地鮮採檸檬，酸甜解渴。" },
            { name: "金針花海", icon: "", x: 43, y: 64, desc: "盛夏時節，滿山遍野的金黃色金針花在山坡上驚艷綻放，交織成耀眼的金黃地毯。" },
            { name: "竹編工藝 DIY", icon: "", x: 41, y: 34, desc: "享受清涼的室內手作時光，利用細緻的竹蔑，編織出精美、實用的生活竹器。" }
        ],
        "秋季 (Autumn)": [
            { name: "大崙山觀光茶園", icon: "", x: 58, y: 78, desc: "秋高氣爽登高望遠的絕佳選擇，欣賞層疊綠油油茶園與壯麗雲海交織的360度大景。" },
            { name: "銀杏步道", icon: "", x: 62, y: 81, desc: "走訪全台最大銀杏林！秋季綠葉轉為璀璨金黃，漫步在黃金銀杏隧道中浪漫無比。" },
            { name: "DIY 焙茶體驗", icon: "", x: 49, y: 37, desc: "在充滿茶香的空間中，親自在茶師帶領下調整火候，烘焙出屬於自己風味的在地茶葉。" },
            { name: "竹管茶餅DIY", icon: "", x: 46, y: 39, desc: "創意十足的特色茶點製作，將甘醇在地茶香與傳統竹管工藝完美結合的趣味體驗。" }
        ],
        "冬季 (Winter)": [
            { name: "石馬公園櫻花", icon: "", x: 52, y: 32, desc: "冬末初春不可錯過的賞櫻聖地！浪漫的河津櫻盛開，將公園染成一片粉紅仙境。" },
            { name: "冬筍挖竹筍體驗", icon: "", x: 57, y: 31, desc: "跟著在地資深農夫走入竹林，體驗尋找並挖掘隱藏在土壤下的冬筍『綠色黃金』。" },
            { name: "長源圳竹林隧道", icon: "", x: 63, y: 40, desc: "高聳入天的林蔭夾道歡迎，清風徐來竹葉沙沙作響，彷彿走入經典武俠電影場景。" },
            { name: "在地特產竹筍乾", icon: "", x: 50, y: 42, desc: "冬日圍爐暖胃的最佳配菜！認識並帶回利用傳統古法醃漬、自然烘乾的鳳尾筍乾。" }
        ]
    };

    const mapContainer = document.getElementById('map-image-container');
    const sidebarList = document.getElementById('sidebar-list');
    const placeholder = document.getElementById('pins-loading-placeholder');

    if (mapContainer && sidebarList) {
        if (placeholder) placeholder.remove(); // 移除載入中字樣

        const savedSeason = localStorage.getItem('trip_season') || "春季 (Spring)";
        const spots = seasonalData[savedSeason] || [];

        spots.forEach((spot, index) => {
            const spotId = `spot-item-${index}`;

            // A. 動態生成地圖大頭針 (Pin)
            const pinWrapper = document.createElement('div');
            pinWrapper.className = 'map-pin-wrapper';
            pinWrapper.style.left = `${spot.x}%`;
            pinWrapper.style.top = `${spot.y}%`;
            pinWrapper.setAttribute('id', `pin-${spotId}`);

            pinWrapper.innerHTML = `
                <span class="pin-icon">📍</span>
                <div class="pin-tooltip">${spot.icon} ${spot.name}</div>
            `;

            // B. 動態生成右側推薦清單卡片 (Recommend Card)
            const card = document.createElement('div');
            card.className = 'sidebar-spot-card';
            card.setAttribute('id', `card-${spotId}`);

            card.innerHTML = `
                <h4>${spot.icon} ${index + 1}. ${spot.name}</h4>
                <p>${spot.desc}</p>
            `;



            // D. 雙向滑鼠懸停連動效果 (Hover Linkage)
            // 當滑鼠移入地圖標點 -> 右側卡片跟著高亮並自動滾動聚焦
            pinWrapper.addEventListener('mouseenter', () => {
                pinWrapper.classList.add('highlighted');
                card.classList.add('highlighted');
                card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            });
            pinWrapper.addEventListener('mouseleave', () => {
                pinWrapper.classList.remove('highlighted');
                card.classList.remove('highlighted');
            });

            // 當滑鼠移入右側卡片 -> 地圖標點跟著放大跳動
            card.addEventListener('mouseenter', () => {
                card.classList.add('highlighted');
                pinWrapper.classList.add('highlighted');
            });
            card.addEventListener('mouseleave', () => {
                card.classList.remove('highlighted');
                pinWrapper.classList.remove('highlighted');
            });

            // 將動態元件掛載到畫面上
            mapContainer.appendChild(pinWrapper);
            sidebarList.appendChild(card);
        });
    }

    // 4. 行程偏好頁邏輯：顯示景點與表單送出
    const currentSpotSpan = document.getElementById('current-spot');
    if (currentSpotSpan) {
        const savedSpot = localStorage.getItem('trip_spot') || '未選擇景點';
        currentSpotSpan.innerText = savedSpot;
    }

    const preferenceForm = document.getElementById('preference-form');
    if (preferenceForm) {
        preferenceForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // 讀取並儲存下拉選單數值
            localStorage.setItem('trip_hotel', document.getElementById('hotel').value);
            localStorage.setItem('trip_transport', document.getElementById('transport').value);
            localStorage.setItem('trip_route', document.getElementById('route').value);
            
            window.location.href = 'result.html'; // 前往規劃結果頁
        });
    }

    // 5. 結果顯示頁邏輯：將所有快取資料繪製至頁面
    const resultCard = document.getElementById('result-card');
    const noDataAlert = document.getElementById('no-data-alert');
    
    if (resultCard && noDataAlert) {
        const season = localStorage.getItem('trip_season');
        const spot = localStorage.getItem('trip_spot');
        const hotel = localStorage.getItem('trip_hotel');
        const transport = localStorage.getItem('trip_transport');
        const route = localStorage.getItem('trip_route');

        // 判斷是否具備完整旅遊資料
        if (season && spot && hotel && transport && route) {
            document.getElementById('res-season').innerText = season;
            document.getElementById('res-spot').innerText = spot;
            document.getElementById('res-hotel').innerText = hotel;
            document.getElementById('res-transport').innerText = transport;
            document.getElementById('res-route').innerText = route;

            noDataAlert.style.display = 'none';
            resultCard.style.display = 'block';
        } else {
            noDataAlert.style.display = 'block';
            resultCard.style.display = 'none';
        }
    }

    // 重新開始規劃按鈕
    const restartBtn = document.getElementById('btn-restart');
    if (restartBtn) {
        restartBtn.addEventListener('click', function() {
            localStorage.clear(); // 清空所有快取紀錄
            window.location.href = 'index.html';
        });
    }

    // 6. 聯絡表單防呆提交
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('感謝您的訊息！我們很快會由專業客服為您解答旅遊細節。');
            this.reset();
        });
    }
    // 在 script.js 的 DOMContentLoaded 事件內追加以下程式碼
const pins = document.querySelectorAll('.map-pin');
const recommendItems = document.querySelectorAll('.recommend-item');

// 功能 A：點擊地圖大頭針，聯動右側卡片
pins.forEach(pin => {
    pin.addEventListener('click', function() {
        const targetSpot = this.getAttribute('data-spot');
        
        // 儲存至本地快取
        localStorage.setItem('trip_spot', targetSpot);

        recommendItems.forEach(item => {
            if (item.getAttribute('data-spot') === targetSpot) {
                item.classList.add('active');
                // 流暢滾動定位到該推薦項目
                item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                item.classList.remove('active');
            }
        });
    });
});

// 功能 B：點擊右側卡片，聯動地圖大頭針（反向聯動）
recommendItems.forEach(item => {
    item.addEventListener('click', function() {
        const targetSpot = this.getAttribute('data-spot');
        localStorage.setItem('trip_spot', targetSpot);

        recommendItems.forEach(i => i.classList.remove('active'));
        this.classList.add('active');

        // 讓對應的 Pin 點產生一個短暫的保時捷動感放大特效
        pins.forEach(pin => {
            if (pin.getAttribute('data-spot') === targetSpot) {
                pin.style.transform = 'translate(-50%, -115%) scale(1.6)';
                setTimeout(() => {
                    pin.style.transform = ''; // 恢復原 CSS 懸停設定
                }, 400);
            }
        });
    });
});
});