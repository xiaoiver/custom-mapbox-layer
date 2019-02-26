attribute vec2 a_pos;
attribute vec4 a_color;

uniform mat4 u_matrix;
uniform float u_point_size;
varying vec4 v_color;

#pragma include "common"
#pragma include "project"

void main() {
    v_color = a_color;
    gl_PointSize = u_point_size;

    vec4 project_pos = project_position(vec4(a_pos, 0.0, 1.0));
    gl_Position = u_matrix * project_pos + u_viewport_center_projection;
}