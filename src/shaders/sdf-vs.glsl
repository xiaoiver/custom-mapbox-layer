attribute vec2 a_pos;
attribute vec2 a_extrude;

uniform vec2 u_extrude_scale;
uniform mat4 u_matrix;

varying vec2 v_uv;

void main() {
    v_uv = a_extrude * 0.5 + 0.5;
    gl_Position = u_matrix * vec4(a_pos, 0.0, 1.0);
    gl_Position.xy += a_extrude * 10. * u_extrude_scale * gl_Position.w;
}