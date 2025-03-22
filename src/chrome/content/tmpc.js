//console.log(printingtools.doc.documentElement.outerHTML)
		console.log(this.msgUris)
		console.log(this.current)
		
		let mainHdrTable = this.getTable(0)
		let firstHdrRowClone = mainHdrTable.rows[0].cloneNode(true)
		let rowHdrDiv = firstHdrRowClone.firstChild.firstChild
		rowHdrDiv.innerText = "Message-ID"
		let hdrVal = firstHdrRowClone.children[1]
		let msgHdr = top.messenger.msgHdrFromURI(this.msgUris[this.current - 1]);

		hdrVal.innerText = msgHdr.messageId
		mainHdrTable.appendChild(firstHdrRowClone)
		console.log(printingtools.doc.documentElement.outerHTML)
