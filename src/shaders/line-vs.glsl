attribute vec2 a_pos;
attribute vec4 a_color;
attribute float a_line_miter;
attribute vec2 a_line_normal;
attribute float a_counters;

uniform mat4 u_matrix;
uniform float u_thickness;

varying vec4 v_color;
varying vec2 v_normal;
varying float v_counters;

#pragma include "common"
#pragma include "project"

void main() {
    v_color = a_color;
    v_counters = a_counters;

    vec3 normal = normalize(vec3(a_line_normal, 0.0) * u_pixels_per_degree);

    vec4 offset = vec4(normal * u_thickness / 2.0 * a_line_miter, 0.0);

    v_normal = vec2(normal * sign(a_line_miter));

    vec4 project_pos = project_position(vec4(a_pos, 0.0, 1.0));
    gl_Position = u_matrix * (project_pos + offset) + u_viewport_center_projection;
}
