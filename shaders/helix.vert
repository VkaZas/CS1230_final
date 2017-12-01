#version 400

layout(location=0) in vec3 position;
layout(location=5) in vec2 texCoord;

out vec2 fragCoord;

void main(void)
{
    fragCoord = texCoord;
    gl_Position = vec4(position, 1.0);
}
