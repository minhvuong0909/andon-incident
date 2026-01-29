using System;
using System.Collections.Generic;

namespace EspFlasher.Entities;

public partial class Notification
{
    public int Id { get; set; }

    public int ConveyorId { get; set; }

    public int UserId { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual Conveyor Conveyor { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
