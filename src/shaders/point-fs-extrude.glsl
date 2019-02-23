precision highp float;

varying vec4 v_color;
varying vec3 v_data;

void main() {
    // float r = length(v_unit);
    // if (r > 1.0) {
    //     discard;
    // }
    // gl_FragColor = v_color;

    vec2 extrude = v_data.xy;
    float extrude_length = length(extrude);

    lowp float antialiasblur = v_data.z;
    float antialiased_blur = -max(0.0, antialiasblur);

    float opacity_t = smoothstep(0.0, antialiased_blur, extrude_length - 1.0);

    // float color_t = stroke_width < 0.01 ? 0.0 : smoothstep(
    //     antialiased_blur,
    //     0.0,
    //     extrude_length - radius / (radius + stroke_width)
    // );

    float color_t = 0.0;

    // gl_FragColor = opacity_t * mix(color * opacity, stroke_color * stroke_opacity, color_t);
    gl_FragColor = opacity_t * v_color;
}