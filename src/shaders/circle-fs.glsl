uniform float u_blur;
uniform float u_opacity;
uniform float u_stroke_width;
uniform float u_stroke_opacity;

varying vec3 v_data;
varying vec4 v_color;
varying float v_radius;
varying vec4 v_stroke_color;

void main() {

    vec2 extrude = v_data.xy;
    float extrude_length = length(extrude);

    lowp float antialiasblur = v_data.z;
    float antialiased_blur = -max(u_blur, antialiasblur);

    float opacity_t = smoothstep(0.0, antialiased_blur, extrude_length - 1.0);
    // float opacity_t = smoothstep(antialiased_blur, 0.0, 1.0 - extrude_length);

    float color_t = u_stroke_width < 0.01 ? 0.0 : smoothstep(
        antialiased_blur,
        0.0,
        extrude_length - v_radius / (v_radius + u_stroke_width)
    );

    gl_FragColor = opacity_t * mix(v_color * u_opacity, v_stroke_color * u_stroke_opacity, color_t);
}