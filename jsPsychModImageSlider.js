var jsPsychModImageSlider = (function (jspsych) {
    "use strict";

    const info = {
        name: "mod-image-slider-response",
        parameters: {
            //declaring trial variables that can be changed
            left_stimulus: {
                type: jspsych.ParameterType.IMAGE,
                pretty_name: "Stimulus",
                default: null,
            },
            right_stimulus: {
                type: jspsych.ParameterType.IMAGE,
                pretty_name: "Stimulus",
                default: null,
            },
            folder_name: {
                type: jspsych.ParameterType.STRING,
                pretty_name: "Folder Name",
                default: null,
            },
            similarity: {
                type: jspsych.ParameterType.DOUBLE,
                pretty_name: "Similarity",
                default: null,
            },
            group_num: {
                type: jspsych.ParameterType.INT,
                pretty_name: "Group Number",
                default: null,
            },
            stimulus_height: {
                type: jspsych.ParameterType.INT,
                pretty_name: "Image height",
                default: null,
            },
            stimulus_width: {
                type: jspsych.ParameterType.INT,
                pretty_name: "Image width",
                default: null,
            },
            maintain_aspect_ratio: {
                type: jspsych.ParameterType.BOOL,
                pretty_name: "Maintain aspect ratio",
                default: true,
            },
            labels: {
                type: jspsych.ParameterType.HTML_STRING,
                pretty_name: "Labels",
                default: [],
                array: true,
            },
            trial_duration: {
                type: jspsych.ParameterType.INT,
                pretty_name: "Trial duration",
                default: null,
            },
            canvas_height: {
                type: jspsych.ParameterType.INT,
                pretty_name: "Canvas Height",
                default: null,
            },
            canvas_width: {
                type: jspsych.ParameterType.INT,
                pretty_name: "Canvas Width",
                default: null,
            },
        },
    };
    
    class ModImageSliderResponsePlugin{
        constructor(jsPsych) {
            this.jsPsych = jsPsych;
        }
        trial(display_element, trial) {
            //declaring trial variables for plugin use
            var height, width;
            var html = "";
            var timer_interval;
            var click_times = [];
            var click_positions = [];
            var made_response = false;


            // half of the thumb width value from jspsych.css, used to adjust the label positions
            var half_thumb_width = 7.5;

            var image1_drawn = false;
            var image2_drawn = false;
            // first clear the display element (because the render_on_canvas method appends to display_element instead of overwriting it with .innerHTML)
            if (display_element.hasChildNodes()) {
                // can't loop through child list because the list will be modified by .removeChild()
                while (display_element.firstChild) {
                    display_element.removeChild(display_element.firstChild);
                }
            }
            // create wrapper div, canvas element and image
            var content_wrapper = document.createElement("div");
            content_wrapper.id = "jspsych-image-slider-response-wrapper";
            content_wrapper.style.margin = "100px 0px";

            //creating canvas for images
            var canvas = document.createElement("canvas");
            canvas.id = "jspsych-image-slider-response-stimulus";
            canvas.style.margin = "0";
            canvas.style.padding = "0";
            var ctx = canvas.getContext("2d");

            //creating images
            var img1 = new Image();
            var img2 = new Image();
            img1.src = trial.left_stimulus;
            img2.src = trial.right_stimulus;

            //border width here, can be changed
            var img_border_width = 5;


            img1.onload = () => {
                // if image wasn't preloaded, then it will need to be drawn whenever it finishes loading
                if (!image1_drawn) {
                    getHeightWidth(); // only possible to get width/height after image loads
                    ctx.drawImage(img1, ctx.lineWidth * 2, ctx.lineWidth * 2, width, height);
                    ctx.lineWidth = img_border_width;
                    ctx.strokeRect(ctx.lineWidth, ctx.lineWidth, width + ctx.lineWidth * 2, height + ctx.lineWidth * 2);
                }
            };
            img2.onload = () => {
                // if image wasn't preloaded, then it will need to be drawn whenever it finishes loading
                if (!image2_drawn) {
                    ctx.drawImage(img2, canvas.width - width - ctx.lineWidth * 2, ctx.lineWidth * 2, width, height);
                    ctx.strokeRect(canvas.width - width - ctx.lineWidth * 3, ctx.lineWidth, width + ctx.lineWidth * 2, height + ctx.lineWidth * 2);
                }
            };

            //set bottom timer
            startCountdown();

            // get/set image height and width - this can only be done after image loads because uses image's naturalWidth/naturalHeight properties
            const getHeightWidth = () => {
                if (trial.stimulus_height !== null) {
                    height = trial.stimulus_height;
                    if (trial.stimulus_width == null && trial.maintain_aspect_ratio) {
                        width = img1.naturalWidth * (trial.stimulus_height / img1.naturalHeight);
                    }
                } else {
                    height = img1.naturalHeight;
                }
                if (trial.stimulus_width !== null) {
                    width = trial.stimulus_width;
                    if (trial.stimulus_height == null && trial.maintain_aspect_ratio) {
                        height = img1.naturalHeight * (trial.stimulus_width / img1.naturalWidth);
                    }
                } else if (!(trial.stimulus_height !== null && trial.maintain_aspect_ratio)) {
                    // if stimulus width is null, only use the image's natural width if the width value wasn't set
                    // in the if statement above, based on a specified height and maintain_aspect_ratio = true
                    width = img1.naturalWidth;
                }

                //need to add extra for image borders
                if (trial.canvas_height !== null) {
                    canvas.height = trial.canvas_height + ctx.lineWidth * 2;
                } else {
                    canvas.height = height * 1.5 + ctx.lineWidth * 2;
                }
                if (trial.canvas_width !== null) {
                    canvas.width = trial.canvas_width + ctx.lineWidth * 2;
                } else {
                    canvas.width = width * 3.5 + ctx.lineWidth * 2;
                }
            };
            getHeightWidth(); // call now, in case image loads immediately (is cached)
            // create container with slider and labels
            var slider_container = document.createElement("div");
            slider_container.style.position = "relative";
            slider_container.style.margin = "0 auto 3em auto";

            html += "<div>";
           //minus 12 on the 5th marker because size of marker is 13.
           //creates the graphics & class info for scale w/ dot
            html += `<div id= "sim_scale"> <hr style="height: 15px; color:black; background-color:black;">
            <div class = "vl"; style = "left: 0px";></div>
            <div class = "vl"; style = "left: ${canvas.width / 4}px";></div>
            <div class = "vl"; style = "left: ${canvas.width / 4 * 2}px";></div>
            <div class = "vl"; style = "left: ${canvas.width / 4 * 3}px";></div>
            <div class = "vl"; style = "left: ${canvas.width / 4 * 4 - 12}px";></div>
            </div>`;
            html += `<div id = "dot"; class = "dot"></div><br><br>
            <style>
            .dot {
                height: 50px;
                width: 50px;
                top: -17px;
                border-radius: 100%;
                background-color: #f00;
                visibility: hidden;
                position: absolute;
                display: inline-block;
            }
            body {
                margin: 0;
                height: 100vh;
                overflow: hidden;

            }
            </style>
            <style>
            .vl {
                border-left: 13px solid black;
                height: 75px; 
                position: absolute;
                display: inline-block;
                top: -30px;
            }
            </style>
            `;

            //adds labels based on scaling of client screen
            for (var j = 0; j < trial.labels.length; j++) {
                var label_width_perc = 100 / (trial.labels.length - 1);
                var percent_of_range = j * (100 / (trial.labels.length - 1));
                var percent_dist_from_center = ((percent_of_range - 50) / 50) * 100;
                var offset = (percent_dist_from_center * half_thumb_width) / 100;
                html +=
                    '<div style="border: 1px solid transparent; display: inline-block; position: absolute; ' +
                    "left:calc(" + percent_of_range + "% - (" +  label_width_perc + "% / 2) - " + offset + "px); text-align: center; width: " +
                    label_width_perc +
                    '%;">';
                html += '<span id = "label"; style="text-align: center; font-size: 200%;">' + trial.labels[j] + "</span>";
                html += "</div>";
            }

            //adding space for timer
            html += '<br><br>';
            html += `<span id="cued-timer" style="font-size: 50px;"></span>`;
            
            html += "</div>";
            slider_container.innerHTML = html;
            // add canvas and slider to content wrapper div
            content_wrapper.insertBefore(canvas, content_wrapper.firstElementChild);
            content_wrapper.insertBefore(slider_container, canvas.nextElementSibling);
            // add content wrapper div to screen and draw image on canvas
            display_element.insertBefore(content_wrapper, null);
            if (img1.complete && Number.isFinite(width) && Number.isFinite(height)) {
                // if image has loaded and width/height have been set, then draw it now
                // (don't rely on img onload function to draw image when image is in the cache, because that causes a delay in the image presentation)
                ctx.drawImage(img1, ctx.lineWidth * 2, ctx.lineWidth * 2, width, height);
                ctx.lineWidth = img_border_width;
                ctx.strokeRect(ctx.lineWidth, ctx.lineWidth, width + ctx.lineWidth * 2, height + ctx.lineWidth * 2);
                image1_drawn = true;
            }
            if (img2.complete && Number.isFinite(width) && Number.isFinite(height)) {
                // if image has loaded and width/height have been set, then draw it now
                // (don't rely on img onload function to draw image when image is in the cache, because that causes a delay in the image presentation)
                ctx.drawImage(img2, canvas.width - width - ctx.lineWidth * 2, ctx.lineWidth * 2, width, height);
                ctx.strokeRect(canvas.width - width - ctx.lineWidth * 3, ctx.lineWidth, width + ctx.lineWidth * 2, height + ctx.lineWidth * 2);
                image2_drawn = true;
            }

            var dot = document.getElementById("dot");
            display_element
            .querySelector("#sim_scale")
            .addEventListener("click", function(event) {
                made_response = true;
                var cur_time = performance.now();

                //find time between this press and last press
                for (var i = -1; i < click_times.length; i++)
                {
                    if (i == -1)
                    {
                        cur_time -= start_time;
                    }
                    else {
                        cur_time -= click_times[i];
                    }
                }

                click_times.push(cur_time);
                dot.style.visibility = "visible";

                //move dot to participant press &* record, based off of client screen scaling but normalized to 1-5.
                //-20 may not be accurate depending on browser size, it intends to account for the dot moving from left to center align.
                dot.style.setProperty("left", (event.clientX - ((window.innerWidth - canvas.width) / 2)  - 20) + "px");
                var Position = Math.round((((event.clientX - (((window.innerWidth - canvas.width) / 2))) / (canvas.width)) * 4 + 1) * 100) / 100;
                click_positions.push(Position);
            });  
            

            //function to check time left and update the countdown timer      
            function startCountdown() {
                timer_interval = setInterval(() => {
                    const remaining = trial.trial_duration - (performance.now() - start_time);
                    let minutes = Math.floor(remaining / 1000 / 60);
                    let seconds = Math.ceil((remaining - minutes * 1000 * 60) / 1000);
                    if (seconds == 60) {
                        seconds = 0;
                        minutes++;
                    }
                    const minutes_str = minutes.toString();
                    const seconds_str = seconds.toString().padStart(2, "0");
                    display_element.querySelector("#cued-timer").textContent = `${minutes_str}:${seconds_str}`;

                    if (remaining <= 0) {
                        display_element.querySelector("#cued-timer").textContent = `${minutes_str}:${seconds_str}`;
                        clearInterval(timer_interval);
                    }
                }, 250);
            };

            //when trial is over, save data & move on.
            this.jsPsych.pluginAPI.setTimeout(() => {
                var trialdata = {
                    answered: made_response,
                    final_press: click_positions[click_positions.length - 1],
                    similarity: trial.similarity,
                    all_presses: click_positions,
                    press_intervals: click_times,
                    folder_name: trial.folder_name,
                    stimuli: [trial.left_stimulus, trial.right_stimulus],
                    group_number: trial.group_num,
                };

                display_element.innerHTML = "";
                // next trial
                    jsPsych.finishTrial(trialdata);
            }, trial.trial_duration);

            var start_time = performance.now();
        }
    }       
    ModImageSliderResponsePlugin.info = info;
    return ModImageSliderResponsePlugin;

})(jsPsychModule);