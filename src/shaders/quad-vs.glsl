attribute vec2 a_extrude;

uniform mat4 u_matrix;
// uniform vec2 u_sdf_map_size;

varying vec2 v_uv;

void main() {
    v_uv = a_extrude * 0.5 + 0.5;
    // gl_Position = u_matrix * vec4(a_pos, 0.0, 1.0);
    gl_Position = vec4(-0.8, -.6, 0.0, 1.0);
    gl_Position.xy += a_extrude * 0.2;
}