using System;
using System.Collections.Generic;

namespace EspFlasher.Entities;

public partial class Assignment
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public int? ConveyorId { get; set; }

    public string Status { get; set; } = null!;

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Conveyor? Conveyor { get; set; }

    public virtual User User { get; set; } = null!;
}
