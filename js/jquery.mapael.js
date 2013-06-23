/**
*
* Jquery Mapael - Dynamic maps jQuery plugin (based on raphael.js)
* Requires jQuery and raphael.js
*
* Version: 0.1.0 (06-22-2013)
*
* Copyright (c) 2013 Vincent Brouté (http://www.neveldo.fr/mapael)
* Licensed under the MIT license (http://www.opensource.org/licenses/mit-license.php).
*
*/
(function($) {

	"use strict";
	
	$.fn.mapael = function(options) {
		options = $.extend(true, {}, $.fn.mapael.defaultOptions, options);
		
		return this.each(function() {
		
			var $tooltip = $("<div>").addClass(options.map.tooltip.cssClass).css("display", "none")
				, $container = $(this).empty().append($tooltip)
				, mapConf = $.fn.mapael.maps[options.map.name]
				, paper = new Raphael(this, mapConf.width, mapConf.height)
				, areaParams = {}
				, legend = {}
				, mapElem = {}
				, hoverParams = {}
				, bbox = {}
				, plotParams = {}
				, textElem = {}
				, coords = {};
				
			options.map.tooltipCss && $tooltip.css(options.map.tooltipCss);
			
			if (options.map.width && options.map.height) {
				paper.setViewBox(0, 0, mapConf.width, mapConf.height, false);
				paper.setSize(options.map.width, options.map.height);
			} 
			
			// Draw map areas
			for (var id in mapConf.elems) {
				areaParams = $.extend(
					true
					, {}
					, options.map.defaultArea
					, (options.areas[id] ? options.areas[id] : {})
				);
				
				if (options.legend.area && areaParams.value) {
					legend = $.fn.mapael.getLegendEl(areaParams.value, options.legend.area);
					legend && $.extend(true, areaParams, legend);
				}
				
				mapElem = paper.path(mapConf.elems[id]).attr(areaParams.attrs);
				
				areaParams.tooltip && areaParams.tooltip.content && $.fn.mapael.setTooltip(mapElem, $tooltip, areaParams.tooltip.content);
				$.fn.mapael.paramHover(mapElem, areaParams.attrs, areaParams.attrsHover);
				
				hoverParams = {"paper" : paper, "mapElem" : mapElem};
				
				// Set a text label in the area
				if (areaParams.text) {
					bbox = mapElem.getBBox();
					textElem = paper.text(
						(bbox.x + bbox.x2) / 2
						, (bbox.y + bbox.y2) / 2
						, areaParams.text
					).attr(areaParams.textAttrs);
					
					areaParams.tooltip && areaParams.tooltip.content && $.fn.mapael.setTooltip(textElem, $tooltip, areaParams.tooltip.content);
					areaParams.attrs.href && (textElem.attr({href: areaParams.attrs.href}));
					$.fn.mapael.paramHover(textElem, areaParams.textAttrs, areaParams.textAttrsHover);
					$.fn.mapael.setHover(paper, mapElem, textElem);
					$.fn.mapael.setCallbacks(areaParams, mapElem, textElem);
				} else {
					$.fn.mapael.setHover(paper, mapElem);
					$.fn.mapael.setCallbacks(areaParams, mapElem);
				}
			}
			
			// Draw additional plots
			for (var i = 0, length = options.plots.length; i < length; ++i) {
				plotParams = $.extend(
						true, {}
						, options.map.defaultPlot
						, (options.plots[i] ? options.plots[i] : {})
					);
				coords = mapConf.getCoords(plotParams.latitude, plotParams.longitude);
					
				if (options.legend.plot && plotParams.value) {
					legend = $.fn.mapael.getLegendEl(plotParams.value, options.legend.plot);
					legend && $.extend(true, plotParams, legend);
				}
				
				if ("square" == plotParams.type) {
					mapElem = paper.rect(
						coords.x - (plotParams.size / 2)
						, coords.y - (plotParams.size / 2)
						, plotParams.size
						, plotParams.size
					);
				} else if ("circle" == plotParams.type) {
					mapElem = paper.circle(coords.x, coords.y, plotParams.size / 2);
				} else {
					throw "Unknown plot type '" + plotParams.type + "'";
				}
				
				mapElem.attr(plotParams.attrs);
				
				plotParams.tooltip && plotParams.tooltip.content && $.fn.mapael.setTooltip(mapElem, $tooltip, plotParams.tooltip.content);
				$.fn.mapael.paramHover(mapElem, plotParams.attrs, plotParams.attrsHover);
				
				// Set a text label next to the plot
				if (plotParams.text) {
					textElem = (mapElem.type == "circle") ?
						paper.text(coords.x + (plotParams.size / 2) + 10, coords.y, plotParams.text)
						: paper.text(coords.x + plotParams.size + 10, coords.y, plotParams.text);
					
					textElem.attr(plotParams.textAttrs);
					
					plotParams.tooltip && plotParams.tooltip.content && $.fn.mapael.setTooltip(textElem, $tooltip, plotParams.tooltip.content);
					plotParams.attrs.href && (textElem.attr({"href": plotParams.attrs.href}));
					$.fn.mapael.paramHover(textElem, plotParams.textAttrs, plotParams.textAttrsHover);
					$.fn.mapael.setHover(paper, mapElem, textElem);
					$.fn.mapael.setCallbacks(areaParams, mapElem, textElem);
				} else {
					$.fn.mapael.setHover(paper, mapElem);
					$.fn.mapael.setCallbacks(areaParams, mapElem);
				}
			}
			
			// Create the legends for areas and plots
			if (options.legend.area.slices && options.legend.area.display) {
				$.fn.mapael.createLegend($container, options, 'area');
			}
			
			if (options.legend.plot.slices && options.legend.plot.display) {
				$.fn.mapael.createLegend($container, options, 'plot');
			}
		});
	};
	
	/**
	* Set user defined callbacks on areas and plots
	* @param areaParams the area parameters
	* @param mapElem the map element to set callback on
	* @param textElem the optional text within the map element
	*/
	$.fn.mapael.setCallbacks = function(areaParams, mapElem, textElem) {
		var callbacks = [];
		if (areaParams.onclick) {
			callbacks.push({
				event : 'click'
				, callback : function() {areaParams.onclick(areaParams, mapElem, textElem)}
			});
		}
		if (areaParams.onmouseenter) {
			callbacks.push({
				event : 'mouseenter'
				, callback : function() {areaParams.onmouseenter(areaParams, mapElem, textElem)}
			});
		}
		if (areaParams.onmouseleave) {
			callbacks.push({
				event : 'mouseleave'
				, callback : function() {areaParams.onmouseleave(areaParams, mapElem, textElem)}
			});
		}
		
		for(var i = 0, length = callbacks.length; i < length; ++i) {
			$(mapElem.node).bind(
				callbacks[i].event
				, callbacks[i].callback
			);
			textElem && $(textElem.node).bind(
				callbacks[i].event
				, callbacks[i].callback
			);
		}
	}
	
	/**
	* Get the legend conf matching with the value
	* @param value the value to match with a slice in the legend
	* @param legend the legend params object
	* @return the legend slice matching with the value
	*/
	$.fn.mapael.getLegendEl = function (value, legend) {
		for(var i = 0, length = legend.slices.length; i < length; ++i) {
			if ((!legend.slices[i].min || value >= legend.slices[i].min) 
				&& (!legend.slices[i].max || value < legend.slices[i].max)
			) {
				return legend.slices[i];
			}
		}
	};
	
	/**
	* Join a tooltip to areas and plots
	* @param elem area or plot element
	* @param $tooltip the tooltip container
	* @param content the content to set in the tooltip
	*/
	$.fn.mapael.setTooltip = function(elem, $tooltip, content) {
		$(elem.node).bind("mouseenter", function() {
			$tooltip.html(content).css("display", "block");
		}).bind("mouseleave", function() {
			$tooltip.css("display", "none");
		}).bind("mousemove", function(e) {
			$tooltip.css("left", e.pageX+20).css("top", e.pageY+20);
		});
	};
	
	/**
	* Draw a legend for areas and / or plots
	* @param $container the legend container
	* @param options map options
	* @param legendType the type of the legend : 'area' or 'plot'
	*/
	$.fn.mapael.createLegend = function ($container, options, legendType) {
		var legendParams = options.legend[legendType]
			, $legend = $('<div>').addClass(legendParams["cssClass"])
			, paper = new Raphael($legend.get(0))
			, width = 5
			, height = 5
			, marginLeft = legendParams.marginLeft
			, marginLeftTitle = legendParams.marginLeftTitle
			, marginLeftLabel = legendParams.marginLeftLabel
			, marginBottom = legendParams.marginBottom
			, title = {}
			, attrParamName = ''
			, elem = {}
			, label = {}
			, lineWidth = {};
			
		$container.append($legend);
		
		if(legendParams.title) {
			title = paper.text(marginLeftTitle, marginBottom, legendParams.title)
				.attr(legendParams.titleAttrs);
				
			width = marginLeftTitle + title.getBBox().width;
			height += marginBottom + title.getBBox().height;
		}
		
		for(var i = 0, length = legendParams.slices.length; i < length; ++i) {
			attrParamName = (legendType == 'plot') ? 'defaultPlot' : 'defaultArea';
			legendParams.slices[i].attrs = $.extend(
				{}
				, options.map[attrParamName].attrs
				, legendParams.slices[i].attrs
			);
			legendParams.slices[i].attrsHover = $.extend(
				{}
				, options.map[attrParamName].attrsHover
				, legendParams.slices[i].attrsHover
			);
			
			if (legendParams.slices[i].type == "circle") {
				elem = paper.circle(
					marginLeft + legendParams.slices[i].size / 2
					, height + legendParams.slices[i].size / 2
					, legendParams.slices[i].size / 2
				).attr(legendParams.slices[i].attrs);
			} else {
				// Draw a square for squared plots AND areas
				!legendParams.slices[i].size && (legendParams.slices[i].size = 20);
				
				elem = paper.rect(
					marginLeft
					, height
					, legendParams.slices[i].size
					, legendParams.slices[i].size
				).attr(legendParams.slices[i].attrs);
			} 
			
			label = paper.text(
				marginLeft + legendParams.slices[i].size + marginLeftLabel
				, height + legendParams.slices[i].size / 2
				, legendParams.slices[i].label
			).attr(legendParams.labelAttrs);
			
			height += marginBottom + legendParams.slices[i].size;
			lineWidth = marginLeft + legendParams.slices[i].size + marginBottom + label.getBBox().width;
			width = (width < lineWidth) ? lineWidth : width;
			
			$.fn.mapael.paramHover(elem, legendParams.slices[i].attrs, legendParams.slices[i].attrsHover);
			$.fn.mapael.paramHover(label, legendParams.labelAttrs, legendParams.labelAttrs);
			$.fn.mapael.setHover(paper, elem, label);
		}
		paper.setSize(width, height);
	}
	
	// Fix IE bug when toFront() is called
	// https://github.com/DmitryBaranovskiy/raphael/issues/225
	$.fn.mapael.mouseHovered = false; 
	$.fn.mapael.elemsHovered = [];
	
	/**
	* Set he behaviour for 'mouseenter' event
	* @param paper paper Raphael paper object
	* @param mapElem mapElem the map element
	* @param textElem the optional text element (within the map element)
	*/
	$.fn.mapael.hoverIn = function (paper, mapElem, textElem) {
		if (!$.fn.mapael.mouseHovered) {
			$.fn.mapael.mouseHovered = true;
			$.fn.mapael.elemsHovered.push(mapElem);
			
			if (mapElem) {
				mapElem.animate(
					mapElem.attrsHover
					, mapElem.attrsHover.animDuration
				);
				mapElem.attrsHover.transform && mapElem.toFront(); 
			}
			
			if (textElem) {
				textElem && textElem.animate(
					textElem.attrsHover
					, textElem.attrsHover.animDuration
				);
				textElem && mapElem.attrsHover.transform && textElem.toFront();
			}
			paper.safari();
		} else {
			// IE fix
			for(var i = 0, length = $.fn.mapael.elemsHovered.length; i < length; ++i) {
				if($.fn.mapael.elemsHovered[i] != mapElem) {
					$($.fn.mapael.elemsHovered[i].node).trigger("mouseout");
				}
			}
			$.fn.mapael.elemsHovered = [];
		}
	}
	
	/**
	* Set he behaviour for 'mouseleave' event
	* @param paper Raphael paper object
	* @param mapElem the map element
	* @param textElem the optional text element (within the map element)
	*/
	$.fn.mapael.hoverOut = function (paper, mapElem, textElem) {
		textElem && textElem.animate(
			textElem.originalAttrs
			, textElem.attrsHover.animDuration
		);
		mapElem && mapElem.animate(
			mapElem.originalAttrs, 
			mapElem.attrsHover.animDuration
		);
		paper.safari();
		$.fn.mapael.mouseHovered = false;
	};
	
	/**
	* Set the hover behavior (mouseenter & mouseleave) for plots and areas
	* @param paper Raphael paper object
	* @param mapElem the map element
	* @param textElem the optional text element (within the map element)
	*/
	$.fn.mapael.setHover = function (paper, mapElem, textElem) {
		var $mapElem = {}
			, $textElem = {};
		if (mapElem) {
			$mapElem = $(mapElem.node);
			$mapElem.bind("mouseenter",
				function () {$.fn.mapael.hoverIn(paper, mapElem, textElem);}
			);
			$mapElem.bind("mouseleave",
				function () {$.fn.mapael.hoverOut(paper, mapElem, textElem);}
			);
		}
		
		if (textElem) {
			$textElem = $(textElem.node);
			$textElem.bind("mouseenter",
				function () {$.fn.mapael.hoverIn(paper, mapElem, textElem);}
			);
			$textElem && $(textElem.node).bind("mouseout",
				function () {$.fn.mapael.hoverOut(paper, mapElem, textElem);}
			);
		}
	};
	
	/**
	* Set the attributes on hover and the attributes to restore for a map element
	* @param elem the map element
	* @param originalAttrs the original attributes to restore on mouseleave event
	* @param attrsHover the attributes to set on mouseenter event
	*/
	$.fn.mapael.paramHover = function (elem, originalAttrs, attrsHover) {
		elem.attrsHover = {};
		$.extend(elem.attrsHover, attrsHover);
		
		if (elem.attrsHover.transform) {
			elem.originalAttrs = {transform : "s1"};
		} else {
			elem.originalAttrs = {};
		}
		$.extend(elem.originalAttrs, originalAttrs);
	};
	
	// Default map options
	$.fn.mapael.defaultOptions = {
		map: {
			tooltip: {
				cssClass: "mapTooltip"
			}
			, defaultArea: {
				attrs: {
					fill: "#343434"
					, stroke: "#5d5d5d"
					, "stroke-width": 1
					, "stroke-linejoin": "round"
				}
				, attrsHover: {
					fill: "#f38a03"
					, animDuration : 300
				}
				, textAttrs: {
					"font-size": 15
					, fill:"#c7c7c7"
					, "text-anchor": "center"
				}
				, textAttrsHover: {
					fill:"#eaeaea"
					, "animDuration" : 300
				}
			}
			, defaultPlot: {
				type: "circle"
				, size: 15
				, attrs: {
					fill: "#0088db" 
					, stroke: "#fff"
					, "stroke-width": 0
					, "stroke-linejoin": "round"
				}
				, attrsHover: {
					"stroke-width": 3
					, animDuration : 300
				}
				, textAttrs: {
					"font-size": 15
					, fill:"#c7c7c7"
					, "text-anchor": "start"
				},
				textAttrsHover: {
					fill:"#eaeaea"
					, animDuration : 300
				}
			}
		}
		, legend: {
			area: {
				cssClass: "mapLegend"
				, display: false
				, marginLeft: 15
				, marginLeftTitle: 5
				, marginLeftLabel: 10
				, marginBottom: 15
				, titleAttrs: {
					"font-size" : 18
					, fill : "#343434"
					, "text-anchor" : "start"
				}
				, labelAttrs: {
					"font-size" : 15
					, fill : "#343434"
					, "text-anchor" : "start"
				}
				, slices : []
			},
			plot: {
				cssClass: "mapLegend"
				, display: false
				, marginLeft: 15
				, marginLeftTitle: 5
				, marginLeftLabel: 10
				, marginBottom: 15
				, titleAttrs: {
					"font-size" : 18
					, fill : "#343434"
					, "text-anchor" : "start"
				}
				, labelAttrs: {
					"font-size" : 15
					, fill : "#343434"
					, "text-anchor" : "start"
				}
				, slices : []
			}
		}
		, areas: {}
		, plots: {}
	};
})(jQuery);