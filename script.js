
// document.querySelectorAll('[class*="live_chatting_donation_message_money__"]').forEach(()=>{

// });
// `<svg width="30" height="30" version="1.1" viewBox="-2 -2 24 24" fill="#f1f1f1" x="0px" y="0px" aria-hidden="true" focusable="false"><path fill-rule="evenodd" clip-rule="evenodd" d="M3 12l7-10 7 10-7 6-7-6zm2.678-.338L10 5.487l4.322 6.173-.85.728L10 11l-3.473 1.39-.849-.729z"></path></svg>`

(function(){
	const formatComma = (num)=>num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	const formatViewerCount = (count)=>{
		if(count >= 10000)
			return `${(count/10000).toFixed(1)}만`;
		else
			return formatComma(count);
	}
	// const setChatColor = ($list)=>{
	// 	$list.forEach($el=>{
	// 		if($el.className.includes("donation")){

	// 		}
	// 		else{
	// 			const $name = $el.querySelector('[class^="live_chatting_username_nickname__"]');
	// 			if(!$name) return;
	// 			$name.style.color = `hsl(${generateColor($name.innerText)}, 100%, 71%)`;
	// 		}
	// 	})
	// }
	

	const $layoutBody = document.getElementById("layout-body");

	let status = "none";
	let $container = null;

	const parseCurrentContainer = ()=>{
		const $childList = [].concat.apply([], [...$layoutBody.children]);
		const $currentContainer = $childList.find($child=>$child.className.startsWith("live_container") || $child.className.startsWith("vod_container") || $child.className.startsWith("channel_container")) || null;
		let currentStatus = "none";
		if($currentContainer){
			if ($currentContainer.className.includes("live_container"))
				currentStatus = "live";
			else if ($currentContainer.className.includes("vod_container"))
				currentStatus = "vod";
			else if ($currentContainer.className.includes("channel_container"))
				currentStatus = "channel";
		}

		return [currentStatus, $currentContainer];
	}

	const onStatusChange = (prevStatus)=>{
		// console.log(prevStatus, status);
		if(prevStatus !== "live" && status === "live"){
			initPlayerFeatures();
		}
	}
	const updateStatus = ()=>{
		const prevStatus = status;
		[status, $container] = parseCurrentContainer();
		onStatusChange(prevStatus);
	}
	const bodyObserver = new MutationObserver(updateStatus);

	bodyObserver.observe($layoutBody, {childList: true});
	updateStatus();

	class ChannelApi{
		static CHANNEL_DETAIL_URL = "https://api.chzzk.naver.com/service/v1/channels/{channelId}/live-detail";

		constructor(){
			this._cache = {};
		}
		getDetail(channelId){
			return new Promise((resolve, reject)=>{
				if(this._cache[channelId]){
					resolve(this._cache[channelId]);
					return;
				}
				fetch(ChannelApi.CHANNEL_DETAIL_URL.replace("{channelId}", channelId), {
					headers: {
						"Accept": "application/json, text/plain, */*",
					}
				}).then(res=>res.json()).then(res=>{
					this._cache[channelId] = res;
					resolve(res);
				}).catch(reject);
			});
		}
		getViewerCount(channelId){
			return this.getDetail(channelId).then(res=>res.content.concurrentUserCount);
		}
		getCategory(channelId){
			return this.getDetail(channelId).then(res=>res.content.liveCategoryValue);
		}
	}

	const api = new ChannelApi();

	function initAside(){
		const $aside = document.getElementById("navigation");
		if(!$aside || $aside.classList.contains("tzzk--active")) return;
		$aside.classList.add("tzzk--active");

		const initNavWrap = ($navWrap)=>{
			const $navList = $navWrap.querySelector('[class^="navigator_list__"]');
			
			const initNavList = ($items)=>{
				$items = $items.filter($e=>$e.className.startsWith("navigator_item__")&&!$e.classList.contains("tzzk__navItem"));
				const initItem = ($item)=>{
					$item.classList.add("tzzk__navItem");
					const $counter = document.createElement("span");
					$counter.className = "tzzk__counter";
					$item.appendChild($counter);
	
					const _href_split = $item.href.split("/live/");
					if(_href_split.length !== 2){ //offline
						$counter.classList.add("tzzk__counter--offline");
						$counter.innerText = "오프라인";
					}
					else{ // live
						const channelId = _href_split[1];
						if(!(/^[0-9a-f]{32}$/.test(channelId))) return;
						// set navNameWrap
						const $navNameWrap = $item.querySelector('[class^="navigator_name__"]');
						// $navNameWrap.classList.add("tzzk__navNameWrap");
	
						// add category
						const $category = document.createElement("span");
						$category.className = "tzzk__category";
						$navNameWrap.appendChild($category);
						api.getCategory(channelId).then(category=>{
							if(category == "talk")
								category = "Just Chatting";
							$category.innerText = category;
						});
	
	
						$counter.classList.add("tzzk__counter--active");
						
						api.getViewerCount(channelId).then(count=>{
							$counter.innerText = formatViewerCount(count);
						});
					}
				}
				$items.forEach(initItem);
			}
			
			const navObserver = new MutationObserver(mutations=>{mutations.forEach(mutation=>initNavList([...mutation.addedNodes]))});
			initNavList([...$navList.children]);
			navObserver.observe($navList, {childList: true});
		}
	
		const _initNavWrap = ($navWrapList)=>{
			$navWrapList.filter($e=>$e.className.startsWith("navigator_wrapper__")).forEach($e=>initNavWrap($e))
		}
		const asideObserver = new MutationObserver(mutations=>{mutations.forEach(mutation=>_initNavWrap([...mutation.addedNodes]))});
		_initNavWrap([...$aside.children]);
		asideObserver.observe($aside, {childList: true});
	}

	const $layoutWrap = document.querySelector("[class^='layout_wrap__']");
	const layoutWrapObserver = new MutationObserver(initAside);
	initAside();
	layoutWrapObserver.observe($layoutWrap, {childList: true});


	function initPlayerFeatures(){
		const $playerWrap = document.getElementById("live_player_layout");
		if (!$playerWrap){
			const playerObserver = new MutationObserver(()=>{
				if(document.getElementById("live_player_layout")){
					playerObserver.disconnect();
					initPlayerFeatures();
				}
			});
			playerObserver.observe($container, {childList: true, subtree: true});
			return;
		}
		const $video = $playerWrap.querySelector(".webplayer-internal-video");
		const $leftBtnWrap = $playerWrap.querySelector(".pzp-pc__bottom-buttons-left");

		const {updateTimer} = (function initTimer(){
			const $timer = document.createElement("div");
			let prevDiff = -10;
			$timer.className = "tzzk__timer";
			$timer.innerText = "실시간";
			$leftBtnWrap.appendChild($timer);

			const onTimerClick = ()=>{
				if($timer.classList.contains("tzzk__timer--live"))
					return;
				$video.currentTime = $video.buffered.end($video.buffered.length-1) - 1;
			}
			$timer.addEventListener("click", onTimerClick);

			const updateTimer = ()=>{
				const l = $video.buffered.length;
				if(!l) return;
				const diff = Math.max($video.buffered.end(l-1) - $video.currentTime - 2.5, 0);
				if (Math.abs(prevDiff-diff) > 1){
					if(Math.round(diff) != 0){
						$timer.classList.remove("tzzk__timer--live");
						const min = Math.floor(diff / 60);
						const sec = Math.floor(diff % 60).toString().padStart(2, "0");
						$timer.innerText = `-${min}:${sec}`;
					}
					else{
						$timer.classList.add("tzzk__timer--live");
						$timer.innerText = "";
					}
				}
				// prevDiff = diff;
			}

			return { updateTimer }
		})();
		const $btnTimer = document.createElement("div");
	
		const onVideoKeyPress=(e)=>{
			$video.dispatchEvent(new Event('mousemove'));
			if(e.keyCode === 37){
				$video.currentTime -= 3;
			}
			else if(e.keyCode === 39){
				$video.currentTime = Math.min($video.currentTime+3, $video.buffered.end($video.buffered.length-1) - 1);
			}
			else if(e.keyCode === 77){
				const $btnVolume = $playerWrap.querySelector(".pzp-pc-volume-button");
				$btnVolume.click();
				// $video.muted = !$video.muted;
			}
		}
		const onVideoPause=()=>{
			$playerWrap.classList.add("playable");
		}
		const onVideoPlay=()=>{
			$playerWrap.classList.remove("playable");
		}
		const onVideoClick=()=>{
			if($playerWrap.classList.contains("playable")){
				$video.play();
			}
		}
		const onVideoTimeUpdate=()=>{
			updateTimer();
		}
	
		$playerWrap.addEventListener("keydown", onVideoKeyPress);
		$video.addEventListener("pause", onVideoPause);
		$video.addEventListener("play", onVideoPlay);
		$video.addEventListener("click", onVideoClick);
		$video.addEventListener("timeupdate", onVideoTimeUpdate);

		$playerWrap.addEventListener("dblclick", (e)=>{
			if($playerWrap.querySelector(".pzp-pc").classList.contains("pzp-pc--adbreak"))
				$playerWrap.querySelector(".btn_skip").click();
		});
	}

})();
