
// document.querySelectorAll('[class*="live_chatting_donation_message_money__"]').forEach(()=>{

// });
// `<svg width="30" height="30" version="1.1" viewBox="-2 -2 24 24" fill="#f1f1f1" x="0px" y="0px" aria-hidden="true" focusable="false"><path fill-rule="evenodd" clip-rule="evenodd" d="M3 12l7-10 7 10-7 6-7-6zm2.678-.338L10 5.487l4.322 6.173-.85.728L10 11l-3.473 1.39-.849-.729z"></path></svg>`


(function () {
	/* 
	const formatComma = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	const formatViewerCount = (count) => {
		if (count >= 10000)
			return `${(count / 10000).toFixed(1)}만`;
		else
			return formatComma(count);
	}
	*/

	const $layoutBody = document.getElementById("layout-body");
	if (!$layoutBody) return;

	let status = "none";
	let $container = null;



	const parseCurrentContainer = () => {
		const $childList = [].concat.apply([], [...$layoutBody.children]);
		const $currentContainer = $childList.find($child => $child.className.startsWith("live_container") || $child.className.startsWith("vod_container") || $child.className.startsWith("channel_container")) || null;
		let currentStatus = "none";
		if ($currentContainer) {
			if ($currentContainer.className.includes("live_container"))
				currentStatus = "live";
			else if ($currentContainer.className.includes("vod_container"))
				currentStatus = "vod";
			else if ($currentContainer.className.includes("channel_container"))
				currentStatus = "channel";
		}

		return [currentStatus, $currentContainer];
	}

	const onStatusChange = (prevStatus) => {
		// console.log(prevStatus, status);
		if (prevStatus !== "live" && status === "live") {
			initPlayerFeatures();
		}
	}
	const updateStatus = () => {
		const prevStatus = status;
		[status, $container] = parseCurrentContainer();
		onStatusChange(prevStatus);
	}
	const bodyObserver = new MutationObserver(updateStatus);

	bodyObserver.observe($layoutBody, { childList: true });
	updateStatus();

	/*
	class ChannelAPI {
		static CHANNEL_DETAIL_URL = "https://api.chzzk.naver.com/service/v2/channels/{channelId}/live-detail";

		constructor() {
			this._cache = {};
		}
		getDetail(channelId) {
			return new Promise((resolve, reject) => {
				if (this._cache[channelId]) {
					resolve(this._cache[channelId]);
					return;
				}
				fetch(ChannelAPI.CHANNEL_DETAIL_URL.replace("{channelId}", channelId), {
					headers: {
						"Accept": "application/json, text/plain, *\/\*",
					}
				}).then(res => res.json()).then(res => {
					this._cache[channelId] = res;
					resolve(res);
				}).catch(reject);
			});
		}
		async getViewerCount(channelId) {
			const res = await this.getDetail(channelId);
			return res.content.concurrentUserCount;
		}
		async getCategory(channelId) {
			return this.getDetail(channelId).then(res => res.content.liveCategoryValue);
		}
		async getTitle(channelId) {
			return this.getDetail(channelId).then(res => res.content.liveTitle);
		}
	}

	const channelAPI = new ChannelAPI();
	*/




	const urlBtnOpenPopupChat = `https://chzzk.naver.com/favicon.ico?tzzkPopupChatChannelId={channelId}`;
	const htmlBtnOpenPopupChat = `<a href="" target="_blank" class="tzzk__chatList_btnOpenPopupChat"><svg width="20" height="20" viewBox="0 0 20 20"><path d="M12 4h2.586L9.293 9.293l1.414 1.414L16 5.414V8h2V2h-6v2z"></path><path d="M4 4h6v2H4v10h10v-6h2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"></path></svg><span>채팅 팝업(심플)</span></a>`;
	const $htmlBtnOpenPopupChat = document.createElement("div");
	$htmlBtnOpenPopupChat.innerHTML = htmlBtnOpenPopupChat;

	const initChatMenuLayer = ($chatMenuWrap) => {
		const $chatMenuLayer = $chatMenuWrap.querySelector('[class^="layer_container__"]');
		if (!$chatMenuLayer) return;
		if ($chatMenuLayer.querySelector('.tzzk__chatList_btnOpenPopupChat')) return;

		const $a = $htmlBtnOpenPopupChat.querySelector("a").cloneNode(true);
		const channelId = location.pathname.split("/")[2];
		if (!(/^[0-9a-f]{32}$/.test(channelId))) { console.error("channelId Error"); return; }

		$a.href = urlBtnOpenPopupChat.replace("{channelId}", channelId);
		$chatMenuLayer.appendChild($a);

	}

	const initChatMenuWrap = () => {
		const $chatMenuWrap = document.querySelector('[class*="live_chatting_header_menu__"]');
		if (!$chatMenuWrap) return;
		const chatMenuObserver = new MutationObserver(mutations => initChatMenuLayer($chatMenuWrap));
		chatMenuObserver.observe($chatMenuWrap, { childList: true });
	}

	const $layoutWrap = document.getElementById("layout-body");
	const layoutWrapObserver = new MutationObserver(() => {
		initChatMenuWrap();// TODO refactor
	});
	initChatMenuWrap();
	layoutWrapObserver.observe($layoutWrap, { childList: true });


	function initPlayerFeatures() {
		const $playerWrap = document.getElementById("live_player_layout");
		if (!$playerWrap) {
			const playerObserver = new MutationObserver(() => {
				if (document.getElementById("live_player_layout")) {
					playerObserver.disconnect();
					initPlayerFeatures();
				}
			});
			playerObserver.observe($container, { childList: true, subtree: true });
			return;
		}
		const $video = $playerWrap.querySelector(".webplayer-internal-video");
		if (!$video) {
			console.warn("video not found");
			return;
		}
		const $leftBtnWrap = $playerWrap.querySelector(".pzp-pc__bottom-buttons-left");

		const initTimerFeature = () => {
			const { updateTimer } = (function initTimer() {
				$playerWrap.querySelector(".live_time").style.position = "absolute";
				$playerWrap.querySelector(".live_time").style.left = "-9999px";

				const $timer = document.createElement("div");
				$timer.className = "tzzk__timer";
				$timer.innerText = "실시간";
				$leftBtnWrap.appendChild($timer);

				const onTimerClick = () => {
					if ($timer.classList.contains("tzzk__timer--live"))
						return;
					$video.currentTime = $video.buffered.end($video.buffered.length - 1) - 1;
				}
				$timer.addEventListener("click", onTimerClick);

				const updateTimer = () => {
					const l = $video.buffered.length;
					if (!l) return;
					const diff = Math.max($video.buffered.end(l - 1) - $video.currentTime - 2.5, 0);
					if (Math.round(diff) != 0) {
						$timer.classList.remove("tzzk__timer--live");
						const min = Math.floor(diff / 60);
						const sec = Math.floor(diff % 60).toString().padStart(2, "0");
						$timer.innerText = `-${min}:${sec}`;
					}
					else {
						$timer.classList.add("tzzk__timer--live");
						$timer.innerText = "";
					}
				}

				return { updateTimer }
			})();
			// const $btnTimer = document.createElement("div");

			const onVideoKeyPress = (e) => {
				$video.dispatchEvent(new Event('mousemove'));
				if (e.keyCode === 37) {
					$video.currentTime -= 3;
				}
				else if (e.keyCode === 39) {
					$video.currentTime = Math.min($video.currentTime + 3, $video.buffered.end($video.buffered.length - 1) - 1);
				}
			}
			const onVideoTimeUpdate = () => {
				updateTimer();
			}
			$playerWrap.addEventListener("keydown", onVideoKeyPress);
			$video.addEventListener("timeupdate", onVideoTimeUpdate);
		}

		if (!$playerWrap.classList.contains("timemachine_mode")) {
			initTimerFeature();
		}



		const onVideoPause = () => {
			$playerWrap.classList.add("playable");
		}
		const onVideoPlay = () => {
			$playerWrap.classList.remove("playable");
		}
		const onVideoClick = () => {
			if ($playerWrap.classList.contains("playable")) {
				$video.play();
			}
		}
		$video.addEventListener("pause", onVideoPause);
		$video.addEventListener("play", onVideoPlay);
		$video.addEventListener("click", onVideoClick);

		$playerWrap.addEventListener("dblclick", (e) => {
			if ($playerWrap.querySelector(".pzp-pc").classList.contains("pzp-pc--adbreak"))
				$playerWrap.querySelector(".btn_skip").click();
		});
	}

})();


(async function initPopupChat() {

	const cache360 = {};
	const generate360 = (s) => {
		if (cache360[s]) return cache360[s];
		let hash = 0;
		const len = Math.min(s.length, 10);
		for (let i = 0; i < len; i++) {
			hash = (hash + s.charCodeAt(i)) % 360;
		}
		cache360[s] = hash;
		return hash;
	}


	if (location.pathname != "/favicon.ico") return;

	const urlParams = new URLSearchParams(location.search);
	const channelId = urlParams.get("tzzkPopupChatChannelId");
	if (!channelId || channelId.length != 32) return;

	const chatChannelId = (await (await fetch("https://api.chzzk.naver.com/service/v2/channels/{channelId}/live-detail".replace("{channelId}", channelId))).json()).content.chatChannelId;
	const chatToken = (await (await fetch("https://comm-api.game.naver.com/nng_main/v1/chats/access-token?channelId={chatChannelId}&chatType=STREAMING".replace("{chatChannelId}", chatChannelId))).json()).content.accessToken;

	const listenChatData = (chatChannelId, chatToken, callback) => {
		const socket = new WebSocket("wss://kr-ss4.chat.naver.com/chat");

		socket.addEventListener("open", function (event) {
			socket.send(`{"ver":"2","cmd":100,"svcid":"game","cid":"${chatChannelId}","bdy":{"uid":null,"devType":2001,"accTkn":"${chatToken}","auth":"READ"},"tid":1}`);
		});
		socket.addEventListener("message", function (event) {
			let data = null;
			try { data = JSON.parse(event.data); }
			catch (e) { console.error("tzzk", e); return; }
			if (!data) return;
			if (data.cmd === 0) {
				socket.send(`{"ver":"2","cmd":10000}`);
				return;
			}
			if (data.cmd !== 93101 || !data.bdy.length) return;

			data.bdy.forEach(callback);
		});
	}

	const { addChat } = (function initUI() {
		document.documentElement.innerHTML = '';
		document.documentElement.className = "tzzkChat__html";
		const $popupWrap = document.createElement("div");
		$popupWrap.id = "tzzkChat__root";
		document.body.appendChild($popupWrap);

		const $chatList = document.createElement("div");
		$chatList.className = "tzzkChat__list";
		$popupWrap.appendChild($chatList);



		const addChat = (nick, msg, badgeImgs = []) => {
			let $badge = null;
			if (badgeImgs.length) {
				$badge = document.createElement("img");
				$badge.className = "tzzkChat__badge";
				$badge.src = badgeImgs[0];
			}

			const $chat = document.createElement("div");
			$chat.className = "tzzkChat__item";

			if ($badge) $chat.appendChild($badge);

			const $nick = document.createElement("span");
			$nick.className = "tzzkChat__nick";
			$nick.innerText = nick;
			$nick.style.color = `hsl(${generate360(nick)}, 100%, 71%)`;

			$chat.appendChild($nick);

			const $msg = document.createElement("span");
			$msg.className = "tzzkChat__msg";
			$msg.innerText = msg;
			$chat.appendChild($msg);

			$chatList.appendChild($chat);
			$chatList.scrollBy(0, 10000);
		}

		return { addChat }
	})();

	listenChatData(chatChannelId, chatToken, (data) => {
		let profile = null;
		try { profile = JSON.parse(data.profile); }
		catch (e) { console.error("tzzk", e); return; }
		addChat(profile?.nickname, data.msg, (profile?.activityBadges || []).map(badge => badge.imageUrl))
	});


})();

