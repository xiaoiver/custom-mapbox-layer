varying vec4 v_data;
varying vec4 v_data2;
varying vec4 v_color;
varying vec4 v_stroke_color;

#pragma include "sdf-2d"

void main() {

    vec2 extrude = v_data.xy;
    lowp float antialiasblur = v_data.z;
    int shape = int(floor(v_data.w + 0.5));

    float radius = v_data2.x;
    float opacity = v_data2.y;
    float stroke_width = v_data2.z;
    float stroke_opacity = v_data2.w;

    float r = radius / (radius + stroke_width);

    float outer_df;
    float inner_df;
    // 'circle', 'triangle', 'square', 'pentagon', 'hexagon', 'octogon', 'hexagram', 'rhombus', 'vesica'
    if (shape == 0) {
        outer_df = sdCircle(extrude, 1.0);
        inner_df = sdCircle(extrude, r);
    } else if (shape == 1) {
        outer_df = sdEquilateralTriangle(1.1 * extrude);
        inner_df = sdEquilateralTriangle(1.1 / r * extrude);
    } else if (shape == 2) {
        outer_df = sdBox(extrude, vec2(1.));
        inner_df = sdBox(extrude, vec2(r));
    } else if (shape == 3) {
        outer_df = sdPentagon(extrude, 0.8);
        inner_df = sdPentagon(extrude, r * 0.8);
    } else if (shape == 4) {
        outer_df = sdHexagon(extrude, 0.8);
        inner_df = sdHexagon(extrude, r * 0.8);
    } else if (shape == 5) {
        outer_df = sdOctogon(extrude, 1.0);
        inner_df = sdOctogon(extrude, r);
    } else if (shape == 6) {
        outer_df = sdHexagram(extrude, 0.52);
        inner_df = sdHexagram(extrude, r * 0.52);
    } else if (shape == 7) {
        outer_df = sdRhombus(extrude, vec2(1.0));
        inner_df = sdRhombus(extrude, vec2(r));
    } else if (shape == 8) {
        outer_df = sdVesica(extrude, 1.1, 0.8);
        inner_df = sdVesica(extrude, r * 1.1, r * 0.8);
    }
    
    float blur = 0.;
    float antialiased_blur = -max(blur, antialiasblur);

    float opacity_t = smoothstep(0.0, antialiased_blur, outer_df);

    float color_t = stroke_width < 0.01 ? 0.0 : smoothstep(
        antialiased_blur,
        0.0,
        inner_df
    );

    gl_FragColor = opacity_t * mix(v_color * opacity, v_stroke_color * stroke_opacity, color_t);
}