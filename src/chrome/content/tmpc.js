//console.log(printingtools.doc.documentElement.outerHTML)
		console.log(this.msgUris)
		console.log(this.current)
		
		let t1 = this.getTable(0)
		let r1 = t1.rows[0].cloneNode(true)
		let t2 = this.getTable(1)
		console.log(t1)
		console.log(t2)
		let d = r1.firstChild.firstChild
		d.innerText = "Message-ID"
		let d2 = r1.children[1]
		let msgHdr = top.messenger.msgHdrFromURI(this.msgUris[this.current - 1]);

		d2.innerText = msgHdr.messageId


		console.log(msgHdr)

		t1.appendChild(r1)
		console.log(t2)
		console.log(printingtools.doc.documentElement.outerHTML)

    let advopts = prefs.getCharPref("extensions.printingtoolsng.advanced.options");

		<baf5bdcb-852c-4272-9590-270dda2c6456@kokkini.net>