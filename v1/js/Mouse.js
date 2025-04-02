window.Mouse = {};
Mouse.init = function(target){

	// Events!
	var _onmousedown = function(event){
		Mouse.moved = false;
		Mouse.pressed = true;
		Mouse.startedOnTarget = true;
		publish("mousedown");
	};
	var _onmousemove = function(event){

		// DO THE INVERSE
		var canvasses = document.getElementById("canvasses");
		var tx = 0;
		var ty = 0;
		var s = 1/loopy.offsetScale;
		var CW = canvasses.clientWidth - _PADDING - _PADDING;
		var CH = canvasses.clientHeight - _PADDING_BOTTOM - _PADDING;

		if(loopy.embedded){
			tx -= _PADDING/2; // dunno why but this is needed
			ty -= _PADDING/2; // dunno why but this is needed
		}
		
		tx -= (CW+_PADDING)/2;
		ty -= (CH+_PADDING)/2;
		
		tx = s*tx;
		ty = s*ty;

		tx += (CW+_PADDING)/2;
		ty += (CH+_PADDING)/2;

		tx -= loopy.offsetX;
		ty -= loopy.offsetY;

		// Mutliply by Mouse vector
		var mx = event.x*s + tx;
		var my = event.y*s + ty;

		// Mouse!
		Mouse.x = mx;
		Mouse.y = my;

		Mouse.moved = true;
		publish("mousemove");

	};
	var _onmouseup = function(){
		Mouse.pressed = false;
		if(Mouse.startedOnTarget){
			publish("mouseup");
			if(!Mouse.moved) publish("mouseclick");
		}
		Mouse.moved = false;
		Mouse.startedOnTarget = false;
	};
	
	// Zoom functionality with mouse wheel
	var _onmousewheel = function(event){
		event.preventDefault();
		
		// Calculate zoom factor - negative delta means zoom in
		var zoomFactor = event.deltaY < 0 ? 1.1 : 0.9;
		
		// Get mouse position before zoom
		var canvasses = document.getElementById("canvasses");
		var rect = canvasses.getBoundingClientRect();
		var mouseX = event.clientX - rect.left;
		var mouseY = event.clientY - rect.top;
		
		// Get current scale and calculate new scale
		var oldScale = loopy.offsetScale;
		var newScale = oldScale * zoomFactor;
		
		// Clamp scale between 0.25 and 3
		newScale = Math.max(0.25, Math.min(3, newScale));
		
		if (newScale !== oldScale) {
			// Calculate how coordinates will change after scale
			// This compensates the zoom to focus on mouse position
			var CW = canvasses.clientWidth - _PADDING - _PADDING;
			var CH = canvasses.clientHeight - _PADDING_BOTTOM - _PADDING;
			
			// Convert mouse to model coordinates before zoom
			var mouseModelX = (mouseX - CW/2) / oldScale + CW/2 - loopy.offsetX;
			var mouseModelY = (mouseY - CH/2) / oldScale + CH/2 - loopy.offsetY;
			
			// Apply scale
			loopy.offsetScale = newScale;
			
			// Calculate required offset to keep mouse at same model position
			var dx = (mouseX - CW/2) * (1/oldScale - 1/newScale);
			var dy = (mouseY - CH/2) * (1/oldScale - 1/newScale);
			
			// Apply offset
			loopy.offsetX += dx;
			loopy.offsetY += dy;
			
			// Force redraw
			publish("model/changed");
		}
	};

	// Add mouse & touch events!
	_addMouseEvents(target, _onmousedown, _onmousemove, _onmouseup);
	
	// Add wheel event for zooming
	target.addEventListener("wheel", _onmousewheel, { passive: false });

	// Cursor & Update
	Mouse.target = target;
	Mouse.showCursor = function(cursor){
		Mouse.target.style.cursor = cursor;
	};
	Mouse.update = function(){
		Mouse.showCursor("");
	};

};