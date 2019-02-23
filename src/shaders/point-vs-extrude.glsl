attribute vec2 a_pos;
attribute vec2 a_unit;
attribute vec4 a_color;

uniform mat4 u_matrix;
uniform vec2 u_extrude_scale;

varying vec4 v_color;
// varying vec2 v_unit;
varying vec3 v_data;

#define DEVICE_PIXEL_RATIO 2.0

void main() {
    v_color = a_color;

    gl_Position = u_matrix * vec4(a_pos, 0, 1);
    gl_Position.xy += a_unit * (50.0) * u_extrude_scale * gl_Position.w;

    lowp float antialiasblur = 1.0 / DEVICE_PIXEL_RATIO / (50.0);

    v_data = vec3(a_unit.x, a_unit.y, antialiasblur);
}