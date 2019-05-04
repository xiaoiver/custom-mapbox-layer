attribute vec2 a_pos;
attribute float a_radius;
attribute vec2 a_extrude;
attribute vec4 a_color;
attribute vec4 a_stroke_color;

uniform mat4 u_matrix;
uniform float u_stroke_width;
uniform vec2 u_extrude_scale;

varying vec4 v_color;
varying vec3 v_data;
varying float v_radius;
varying vec4 v_stroke_color;

#pragma include "common"
#define DEVICE_PIXEL_RATIO 1.0

void main() {
    v_color = a_color;
    v_radius = a_radius;
    v_stroke_color = a_stroke_color;
    gl_Position = u_matrix * vec4(a_pos, 0.0, 1.0);
    gl_Position.xy += a_extrude * (a_radius + u_stroke_width) * u_extrude_scale * gl_Position.w;

    float antialiasblur = 1.0 / DEVICE_PIXEL_RATIO / (a_radius + u_stroke_width);

    v_data = vec3(a_extrude.x, a_extrude.y, antialiasblur);
}