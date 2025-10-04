"""
Weeks-of-life visualizer using Tkinter.

Refactor highlights:
- Modular, typed helpers for week math, grid sizing, and drawing
- No global mutable state; configuration collected in a dataclass
- Exact number of cells equals total weeks (no extra trailing boxes)
- Clear comments and docstrings for maintainability
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date
import math
from PySide6.QtWidgets import QApplication, QWidget
from PySide6.QtGui import QPainter, QColor, QPen
from PySide6.QtCore import Qt
from typing import Tuple

# ----------------------------
# Configuration
# ----------------------------
BIRTHDAY = date(1972, 11, 15)
DEATHDAY = date(2072, 11, 15)


@dataclass(frozen=True)
class VisualConfig:
    """Visual styling and layout parameters for the grid."""
    side: int = 10                  # Square size (pixels)
    space: int = 4                  # Gap between squares (pixels)
    margin: int = 10                # Outside margin (pixels)
    lived_color: str = "red"
    remaining_color: str = "green"
    outline_color: str = "black"


# ----------------------------
# Core computations
# ----------------------------

def whole_weeks_between(d1: date, d2: date) -> int:
    """Return non-negative whole weeks from d1 to d2 (flooring by 7 days).

    If d2 < d1, returns 0.
    """
    days = (d2 - d1).days
    if days <= 0:
        return 0
    return days // 7


def compute_weeks(birth: date, death: date, today: date | None = None) -> Tuple[int, int, int]:
    """Compute lived, remaining, and total weeks given birth/death dates.

    Returns (lived, remaining, total).
    """
    today = today or date.today()

    lived = whole_weeks_between(birth, today)
    remaining = whole_weeks_between(today, death)
    total = lived + remaining

    return lived, remaining, total


def choose_grid(total_cells: int) -> Tuple[int, int]:
    """Choose an approximately square grid (cols, rows) for total_cells.

    Tries to make the grid slightly wider than tall for readability.
    Ensures cols, rows >= 1 and cols * rows >= total_cells.
    """
    if total_cells <= 0:
        return 1, 1

    # Start from sqrt for near-square, then bias a bit wider
    ideal = max(1, int(math.sqrt(total_cells)))
    cols = max(1, ideal + max(0, ideal // 6))  # ~ +16% width bias
    rows = math.ceil(total_cells / cols)

    # Guarantee enough cells; if our bias undershot, bump rows
    if cols * rows < total_cells:
        rows = math.ceil(total_cells / cols)

    return cols, rows


# ----------------------------
# Drawing helpers
# ----------------------------

def canvas_size(cols: int, rows: int, cfg: VisualConfig) -> Tuple[int, int]:
    """Compute canvas pixel size for a grid with given cols/rows."""
    width = cfg.margin * 2 + cols * cfg.side + (cols - 1) * cfg.space
    height = cfg.margin * 2 + rows * cfg.side + (rows - 1) * cfg.space
    return width, height


def cell_xy(col: int, row: int, cfg: VisualConfig) -> Tuple[int, int]:
    """Top-left (x, y) pixel of a grid cell at (col, row)."""
    x = cfg.margin + col * (cfg.side + cfg.space)
    y = cfg.margin + row * (cfg.side + cfg.space)
    return x, y


def draw_square(painter: QPainter, x: int, y: int, cfg: VisualConfig, fill: str) -> None:
    """Draw a single square cell using QPainter."""
    color = QColor(fill)
    outline = QColor(cfg.outline_color)
    painter.setPen(QPen(outline))
    painter.setBrush(color)
    painter.drawRect(x, y, cfg.side, cfg.side)


def draw_weeks_grid(painter: QPainter, lived: int, total: int, cols: int, rows: int, cfg: VisualConfig) -> None:
    """Draw exactly `total` squares, coloring the first `lived` as lived.

    Cells fill row-major: left→right, top→bottom.
    """
    for idx in range(total):
        row = idx // cols
        col = idx % cols
        x, y = cell_xy(col, row, cfg)
        color = cfg.lived_color if idx < lived else cfg.remaining_color
        draw_square(painter, x, y, cfg, color)


# Qt supports image export differently, so leave out for now.


# ----------------------------
# Main UI
# ----------------------------

class WeeksLifeWidget(QWidget):
    def __init__(self, lived: int, total: int, cols: int, rows: int, cfg: VisualConfig, parent=None):
        super().__init__(parent)
        self.lived = lived
        self.total = total
        self.cols = cols
        self.rows = rows
        self.cfg = cfg

    def paintEvent(self, event):
        painter = QPainter(self)
        draw_weeks_grid(
            painter,
            lived=self.lived,
            total=self.total,
            cols=self.cols,
            rows=self.rows,
            cfg=self.cfg
        )


def build_ui(birth: date, death: date, cfg: VisualConfig = VisualConfig()) -> None:
    """Create the Qt UI, draw the weeks grid, and start the main loop."""
    lived, remaining, total = compute_weeks(birth, death)

    print(f"Total weeks to live: {total}")
    print(f"Weeks already lived: {lived}")
    print(f"Weeks remaining:     {remaining}")

    cols, rows = choose_grid(total)
    print(f"Grid: {cols} per row × {rows} rows")

    w, h = canvas_size(cols, rows, cfg)

    app = QApplication([])
    widget = WeeksLifeWidget(lived, total, cols, rows, cfg)
    widget.setWindowTitle("Weeks of Life")
    widget.resize(w, h)
    widget.show()
    app.exec()


if __name__ == "__main__":
    build_ui(BIRTHDAY, DEATHDAY)
