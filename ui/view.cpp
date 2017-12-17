#include "view.h"
#include "viewformat.h"
#include "utils/resourceloader.h"
#include "gl/shaders/ShaderAttribLocations.h"
#include "glm.hpp"

#include <QApplication>
#include <QKeyEvent>
#include <iostream>

View::View(QWidget *parent) : QGLWidget(ViewFormat(), parent),
    m_time(), m_timer(), m_captureMouse(false), m_increment(0), m_fps(60.0), m_rain(0),m_aa(0),m_fog(0),m_snow(0),
    m_seaReflection(0),m_seaRefraction(0), m_seaShadow(0),m_light(0),m_ladder(0),m_playbackTime(0),m_pause(false)
{
    // View needs all mouse move events, not just mouse drag events
    setMouseTracking(true);

    // Hide the cursor
    if(m_captureMouse) {
        QApplication::setOverrideCursor(Qt::BlankCursor);
    }

    // View needs keyboard focus
    setFocusPolicy(Qt::StrongFocus);

    // The update loop is implemented using a timer
    connect(&m_timer, SIGNAL(timeout()), this, SLOT(tick()));
}

View::~View()
{
}


void View::initializeGL()
{
    // All OpenGL initialization *MUST* be done during or after this
    // method. Before this method is called, there is no active OpenGL
    // context and all OpenGL calls have no effect.

    // Initialize glew
    ResourceLoader::initializeGlew();

    // Create helix shader program
    m_helixProgramID = ResourceLoader::createShaderProgram(":/shaders/shaders/helix.vert", ":/shaders/shaders/helix.frag");
    glUseProgram(m_helixProgramID);

    // Draw a squad for screen space
    m_screenSquad = make_unique<OpenGLShape>();
    vector<GLfloat> screenSquadVerts{
       -1.0f, 1.0f, 0.0f, 0.0f, 0.0f,
       -1.0f, -1.0f, 0.0f, 0.0f, 1.0f,
       1.0f, 1.0f, 0.0f, 1.0f, 0.0f,
       1.0f, -1.0f, 0.0f, 1.0f, 1.0f
    };
    m_screenSquad->setVertexData(screenSquadVerts.data(), screenSquadVerts.size(), VBO::GEOMETRY_LAYOUT::LAYOUT_TRIANGLE_STRIP, 4);
    m_screenSquad->setAttribute(CS123::GL::ShaderAttrib::POSITION, 3, 0, VBOAttribMarker::DATA_TYPE::FLOAT, false);
    m_screenSquad->setAttribute(CS123::GL::ShaderAttrib::TEXCOORD0, 2, 3 * sizeof(VBOAttribMarker::DATA_TYPE::FLOAT), VBOAttribMarker::DATA_TYPE::FLOAT, false);
    m_screenSquad->buildVAO();

    // Start a timer that will try to get 60 frames per second (the actual
    // frame rate depends on the operating system and other running programs)
    m_time.start();
    m_timer.start(1000 / 60);

//    glEnable(GL_DEPTH_TEST);
//    glEnable(GL_CULL_FACE);
//    glCullFace(GL_BACK);
//    glFrontFace(GL_CCW);
}


void View::toggleRain(bool checked) {
    m_rain = checked? 1.0: 0;
}

void View::toggleFog(bool checked) {
    m_fog = checked? 1.0: 0;
}

void View::toggleSnow(bool checked) {
    m_snow = checked? 1.0: 0;
}

void View::toggleAA(bool checked) {
    m_aa = checked? 1.0: 0;
}

void View::toggleSeaReflection(bool checked) {
    m_seaReflection = checked? 1.0: 0;
}

void View::toggleSeaRefraction(bool checked) {
    m_seaRefraction = checked? 1.0: 0;
}

void View::toggleSeaStorm(bool checked) {
    m_seaStorm = checked? 1.0: 0;
}

void View::toggleSeaShadow(bool checked) {
    m_seaShadow = checked? 1.0: 0;
}

void View::toggleLadder(bool checked) {
    m_ladder = checked? 1.0: 0;
}

void View::toggleLight(bool checked) {
    m_light = checked? 1.0: 0;
}

void View::toggleAO(bool checked) {
    m_ao = checked? 1.0: 0;
}

void View::toggleDisplacement(bool checked) {
    m_dis = checked? 1.0: 0;
}

void View::paintGL()
{
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

    float time = m_pause ? m_increment / m_fps : m_increment++ / m_fps;

    // Pass user defined arguments(booleans) to the fragment shader as floats
    glUniform1f(glGetUniformLocation(m_helixProgramID, "iTime"), max(time - m_playbackTime, 0.f));
    glUniform3f(glGetUniformLocation(m_helixProgramID, "iResolution"), m_width * 1.0f, m_height * 1.0f, 1.0f);
    glUniform1f(glGetUniformLocation(m_helixProgramID, "iRain"), m_rain);
    glUniform1f(glGetUniformLocation(m_helixProgramID, "iSnow"), m_snow);
    glUniform1f(glGetUniformLocation(m_helixProgramID, "iFog"), m_fog);
    glUniform1f(glGetUniformLocation(m_helixProgramID, "iAA"), m_aa);
    glUniform1f(glGetUniformLocation(m_helixProgramID, "iSeaReflection"), m_seaReflection);
    glUniform1f(glGetUniformLocation(m_helixProgramID, "iSeaRefraction"), m_seaRefraction);
    glUniform1f(glGetUniformLocation(m_helixProgramID, "iSeaStorm"), m_seaStorm);
    glUniform1f(glGetUniformLocation(m_helixProgramID, "iSeaShadow"), m_seaShadow);
    glUniform1f(glGetUniformLocation(m_helixProgramID, "iLadder"), m_ladder);
    glUniform1f(glGetUniformLocation(m_helixProgramID, "iLight"), m_light);
    glUniform1f(glGetUniformLocation(m_helixProgramID, "iAO"), m_ao);
    glUniform1f(glGetUniformLocation(m_helixProgramID, "iDisplace"), m_dis);

    // TODO: Implement the demo rendering here
    m_screenSquad->draw();
}

void View::resizeGL(int w, int h)
{
    float ratio = static_cast<QGuiApplication *>(QCoreApplication::instance())->devicePixelRatio();
    m_width = w = static_cast<int>(w / ratio);
    m_height = h = static_cast<int>(h / ratio);
    glUniform3i(glGetUniformLocation(m_helixProgramID, "iResolution"), m_width, m_height, 0);
    glViewport(0, 0, w, h);
}

void View::mousePressEvent(QMouseEvent *event)
{
}

void View::mouseMoveEvent(QMouseEvent *event)
{
    // This starter code implements mouse capture, which gives the change in
    // mouse position since the last mouse movement. The mouse needs to be
    // recentered after every movement because it might otherwise run into
    // the edge of the screen, which would stop the user from moving further
    // in that direction. Note that it is important to check that deltaX and
    // deltaY are not zero before recentering the mouse, otherwise there will
    // be an infinite loop of mouse move events.
    if(m_captureMouse) {
        int deltaX = event->x() - width() / 2;
        int deltaY = event->y() - height() / 2;
        if (!deltaX && !deltaY) return;
        QCursor::setPos(mapToGlobal(QPoint(width() / 2, height() / 2)));

        // TODO: Handle mouse movements here
    }
}

void View::mouseReleaseEvent(QMouseEvent *event)
{
}

void View::keyPressEvent(QKeyEvent *event)
{
    if (event->key() == Qt::Key_Escape) QApplication::quit();

    // Controlling playback time with left arrow and right arrow on keyboard
    if (event->key() == Qt::Key_Left) m_playbackTime += 5;
    else if (event->key() == Qt::Key_Right) m_playbackTime -= 5;
    else if (event->key() == Qt::Key_Space) m_pause = !m_pause;
}

void View::keyReleaseEvent(QKeyEvent *event)
{
}

void View::tick()
{
    // Get the number of seconds since the last tick (variable update rate)
    float seconds = m_time.restart() * 0.001f;

    // TODO: Implement the demo update here

    // Flag this view for repainting (Qt will call paintGL() soon after)
    update();
}
