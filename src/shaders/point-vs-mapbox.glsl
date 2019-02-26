attribute vec2 a_pos;
attribute vec4 a_color;

uniform mat4 u_matrix;
uniform float u_point_size;

varying vec4 v_color;

#pragma include "common"

void main() {
    v_color = a_color;
    gl_PointSize = u_point_size;
    gl_Position = u_matrix * vec4(a_pos, 0.0, 1.0);
}