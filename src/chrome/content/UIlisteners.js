var getUI_status = {

	startup: function() {
	  this.observerService = Components.classes[
		  "@mozilla.org/observer-service;1"]
		.getService(Components.interfaces.nsIObserverService);
	  this.observerService.addObserver(this, "mail:updateToolbarItems",
		false);
	//this.setElementStatus();
	  
	},
  
  
	shutdown: function() {
		this.observerService.removeObserver(this, "mail:updateToolbarItems");
		
	  },
	
	  observe: function(aSubject, aTopic, aState) {
		switch (aTopic) {
		  case "mail:updateToolbarItems":
			this.setElementStatus();
			
		  }
	  },

	  setElementStatus: function () {

		let tbb_p = document.getElementById("ptng-button-print");
		let tbb_pp = document.getElementById("ptng-button-printpreview");
		
		let fmp = document.getElementById("printMenuItem");
		let amp = document.getElementById("appmenu_print");
		let ctxmp = document.getElementById("mailContext-print");
		

		if (gFolderDisplay.selectedCount > 0) {
			tbb_p.removeAttribute("disabled");
			tbb_pp.removeAttribute("disabled")
			fmp.removeAttribute("disabled")
			amp.removeAttribute("disabled")
			ctxmp.removeAttribute("disabled")

		} else {
			tbb_p.setAttribute("disabled", "true");
			tbb_pp.setAttribute("disabled", "true");
			fmp.setAttribute("disabled", "true");
			amp.setAttribute("disabled", "true");
			ctxmp.setAttribute("disabled", "true");
		}
	  }
	}