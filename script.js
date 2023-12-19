(function(){
	const $chatContainer = document.querySelector('[class*="live_chatting_list_container__"]');
	function generateColor(s) {
	    let hash = 0;
	    for (let i = 0; i < s.length; i++) {
	        hash = (hash + s.charCodeAt(i)) % 255;
	    }
	    return hash;
	}
	const setChatColor = ($list)=>{
		$list.forEach($el=>{
			if($el.className.includes("donation")){

			}
			else{
				const $name = $el.querySelector('[class^="live_chatting_username_nickname__"]');
				if(!$name) return;
				$name.style.color = `hsl(${generateColor($name.innerText)}, 100%, 71%)`;
			}
		})
	}


	function initChat($chatWrap){
		const observer = new MutationObserver((mutations) => { 
			mutations.forEach(mutation => {
				setChatColor([...mutation.addedNodes]);
			});
		 });

		setChatColor([...$chatWrap.querySelectorAll('[class*="live_chatting_list_item"]')]);

		observer.observe($chatWrap, {childList: true});
	}

	setInterval(()=>{
		const $chatWrap = document.querySelector('[class^="live_chatting_list_wrapper"]');
		if($chatWrap && !$chatWrap.classList.contains("themeActive")) {
			$chatWrap.classList.add("themeActive");
			initChat($chatWrap);
		}
	}, 500); // TODO 최적화 ㅎㅎ

})();
